import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
const db = require('@/lib/db');

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';

    let buffer;
    let mimeType = 'image/jpeg';
    let extension = 'jpg';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('photo');

      if (!file) {
        return NextResponse.json({ error: 'No photo file provided' }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 });
      }

      mimeType = file.type;
      if (!ALLOWED_TYPES.includes(mimeType)) {
        return NextResponse.json({
          error: 'Invalid file format. Only JPG, PNG, and WebP images are allowed.'
        }, { status: 400 });
      }

      if (mimeType === 'image/png') extension = 'png';
      else if (mimeType === 'image/webp') extension = 'webp';
      else extension = 'jpg';

      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      // JSON with base64 payload
      const body = await request.json();
      if (!body.photoBase64) {
        return NextResponse.json({ error: 'photoBase64 is required' }, { status: 400 });
      }

      const match = body.photoBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (!match) {
        return NextResponse.json({ error: 'Invalid base64 image data' }, { status: 400 });
      }

      mimeType = match[1];
      if (!ALLOWED_TYPES.includes(mimeType)) {
        return NextResponse.json({
          error: 'Invalid file format. Only JPG, PNG, and WebP images are allowed.'
        }, { status: 400 });
      }

      if (mimeType === 'image/png') extension = 'png';
      else if (mimeType === 'image/webp') extension = 'webp';
      else extension = 'jpg';

      buffer = Buffer.from(match[2], 'base64');
      if (buffer.length > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 });
      }
    }

    // Ensure public/uploads exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `avatar_${Date.now()}.${extension}`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, buffer);

    // Also keep base64 representation in user_profile for instant portability
    const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
    const photoUrl = `/uploads/${filename}`;

    const profile = db.getProfile();
    profile.profile_photo_url = photoUrl;
    profile.profile_photo_data_url = dataUrl;
    db.saveProfile(profile);

    db.addActivityLog({
      type: 'profile_updated',
      title: 'Profile photo updated',
      description: 'Uploaded and saved new candidate profile photo.',
      user: 'Adarsh Vinothan',
    });

    return NextResponse.json({
      success: true,
      profile_photo_url: photoUrl,
      profile,
    });
  } catch (error) {
    console.error('Profile photo upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const profile = db.getProfile();
    const oldUrl = profile.profile_photo_url;

    if (oldUrl && oldUrl.startsWith('/uploads/')) {
      const oldPath = path.join(process.cwd(), 'public', oldUrl.split('?')[0]);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (e) {
          console.warn('Could not delete old avatar file:', e);
        }
      }
    }

    profile.profile_photo_url = '';
    profile.profile_photo_data_url = '';
    db.saveProfile(profile);

    db.addActivityLog({
      type: 'profile_updated',
      title: 'Profile photo removed',
      description: 'Candidate profile photo removed; reset to default avatar.',
      user: 'Adarsh Vinothan',
    });

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error('Profile photo delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
