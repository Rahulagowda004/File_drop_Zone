// src/app/api/cron/cleanup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cleanupExpiredFiles } from "@/lib/fileStore";

// API route to clean up expired files
// This can be called by a scheduled task/cron job
export async function POST(request: NextRequest) {
  try {
    // Check for authorization (optional, but recommended for production)
    // const authHeader = request.headers.get("authorization");
    // if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const deletedCount = await cleanupExpiredFiles();

    return NextResponse.json({
      success: true,
      message: `Cleanup completed successfully. Deleted ${deletedCount} expired files.`,
      deletedCount,
    });
  } catch (error: any) {
    console.error("Error in cleanup job:", error);
    return NextResponse.json(
      { error: "Failed to run cleanup job: " + error.message },
      { status: 500 }
    );
  }
}

// GET method for testing the cleanup function
export async function GET(request: NextRequest) {
  try {
    const deletedCount = await cleanupExpiredFiles();

    return NextResponse.json({
      success: true,
      message: `Cleanup completed successfully. Deleted ${deletedCount} expired files.`,
      deletedCount,
    });
  } catch (error: any) {
    console.error("Error in cleanup job:", error);
    return NextResponse.json(
      { error: "Failed to run cleanup job: " + error.message },
      { status: 500 }
    );
  }
}
