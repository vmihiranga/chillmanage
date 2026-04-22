import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { id } = await params;

  try {
    const body = await request.json();
    const { title, description, date, color } = body;

    if (!title || !date) {
      return NextResponse.json({ error: 'title and date are required' }, { status: 400 });
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        date: new Date(date),
        color: color || '#6366f1',
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error('PUT /api/events/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.event.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/events/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
