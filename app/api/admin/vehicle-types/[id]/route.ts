import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

const vehicleSchema = z.object({
  name: z.string().min(1),
  capacity: z.number().int().min(1),
  image: z.string().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const parse = vehicleSchema.safeParse(body);
    if (!parse.success) {
            return NextResponse.json({ error: 'Check the vehicle type fields and try again.', details: parse.error.flatten() }, { status: 400 });
    }
    const { name, capacity, image } = parse.data;
    const updated = await db.vehicleType.update({
      where: { id: params.id },
      data: { name, capacity, image },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating vehicle type:', error);
    return NextResponse.json({ error: 'Failed to update vehicle type' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await db.vehicleType.delete({ where: { id: params.id } });
    return NextResponse.json({ message: 'Vehicle type deleted' });
  } catch (error) {
    console.error('Error deleting vehicle type:', error);
    return NextResponse.json({ error: 'Failed to delete vehicle type' }, { status: 500 });
  }
}
