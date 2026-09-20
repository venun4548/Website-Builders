import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, signJWT } from '@/lib/auth';
import { updateRow, findRow } from '@/lib/sheets';
import { auditLog } from '@/lib/auditLog';
import { sendNotification } from '@/lib/notify';
import { SECURE_COOKIE_OPTIONS } from '@/lib/csrf';
import { User } from '@/types/schema';

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updatedUser = await updateRow<User>('Users', session.userId, {
      onboardingComplete: 'true',
    });

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Refresh JWT session cookie with onboardingComplete = true
    const refreshedToken = await signJWT({
      userId: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      company: updatedUser.company,
      onboardingComplete: true,
    }, '24h');

    // Notify user
    await sendNotification(
      updatedUser.id,
      'stage_change',
      'Onboarding Completed!',
      'Your brand guidelines and project brief have been received by our engineering team.',
      '/user/projects'
    );

    // Audit log
    await auditLog({
      actorEmail: updatedUser.email,
      actorRole: updatedUser.role,
      action: 'COMPLETE_ONBOARDING',
      resourceType: 'user',
      resourceId: updatedUser.id,
      resourceName: updatedUser.name,
      details: { email: updatedUser.email },
      req,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
      user: updatedUser,
    });

    response.cookies.set('session', refreshedToken, {
      ...SECURE_COOKIE_OPTIONS,
      maxAge: 24 * 60 * 60,
    });

    return response;
  } catch (err) {
    console.error('PUT /api/user/onboarding/complete error:', err);
    return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 });
  }
}
