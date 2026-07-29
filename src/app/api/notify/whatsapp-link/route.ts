import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Format click to share link
    const encodedText = encodeURIComponent(message);
    const whatsappLink = `https://wa.me/?text=${encodedText}`;

    return NextResponse.json({
      success: true,
      link: whatsappLink
    });
  } catch (error: any) {
    console.error("WhatsApp Link generation error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate link" }, { status: 500 });
  }
}
