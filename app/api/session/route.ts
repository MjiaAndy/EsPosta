import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse(JSON.stringify({ error: "No autenticado" }), { 
      status: 401, 
      headers: { 'Content-Type': 'application/json', ...corsHeaders } 
    });
  }

  return new NextResponse(JSON.stringify(session), { 
    status: 200, 
    headers: { 'Content-Type': 'application/json', ...corsHeaders } 
  });
}