import { NextRequest, NextResponse } from 'next/server';
import { findRow, updateRow, now } from '@/lib/sheets';
import { SatisfactionSurvey } from '@/types/schema';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    const survey = await findRow<SatisfactionSurvey>('SatisfactionSurveys', (s) => s.token === token);
    if (!survey) {
      return NextResponse.json({ error: 'Survey not found or link expired.' }, { status: 404 });
    }

    // If first time opened, mark openedAt
    if (!survey.openedAt) {
      await updateRow<SatisfactionSurvey>('SatisfactionSurveys', survey.id, {
        openedAt: now(),
        status: survey.status === 'Sent' ? 'Opened' : survey.status,
      });
    }

    const isSubmitted = survey.status === 'Submitted' || Boolean(survey.submittedAt);

    return NextResponse.json({
      survey: {
        id: survey.id,
        clientName: survey.clientName,
        projectId: survey.projectId,
        isSubmitted,
        submittedAt: survey.submittedAt,
        scores: isSubmitted
          ? {
              scoreOverall: survey.scoreOverall,
              scoreCommunication: survey.scoreCommunication,
              scoreQuality: survey.scoreQuality,
              scoreTimeliness: survey.scoreTimeliness,
              scoreSupport: survey.scoreSupport,
              recommend: survey.recommend,
              comments: survey.comments,
            }
          : undefined,
      },
    });
  } catch (err: any) {
    console.error('Error fetching survey by token:', err);
    return NextResponse.json({ error: 'Failed to retrieve survey.' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    const survey = await findRow<SatisfactionSurvey>('SatisfactionSurveys', (s) => s.token === token);
    if (!survey) {
      return NextResponse.json({ error: 'Survey not found.' }, { status: 404 });
    }

    if (survey.status === 'Submitted' || survey.submittedAt) {
      return NextResponse.json(
        { error: 'This survey has already been completed. Thank you!' },
        { status: 409 }
      );
    }

    const body = await req.json();
    const {
      scoreOverall = 5,
      scoreCommunication = 5,
      scoreQuality = 5,
      scoreTimeliness = 5,
      scoreSupport = 5,
      recommend = 'true',
      comments = '',
    } = body;

    const updated = await updateRow<SatisfactionSurvey>('SatisfactionSurveys', survey.id, {
      scoreOverall: Number(scoreOverall),
      scoreCommunication: Number(scoreCommunication),
      scoreQuality: Number(scoreQuality),
      scoreTimeliness: Number(scoreTimeliness),
      scoreSupport: Number(scoreSupport),
      recommend: recommend ? 'true' : 'false',
      comments: String(comments).trim(),
      submittedAt: now(),
      status: 'Submitted',
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your feedback has been recorded.',
      survey: updated,
    });
  } catch (err: any) {
    console.error('Error submitting survey:', err);
    return NextResponse.json({ error: 'Failed to submit survey.' }, { status: 500 });
  }
}
