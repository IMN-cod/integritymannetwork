import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/school/enroll — Public enrollment
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { courseId, firstName, lastName, email, phone, notes } = body;

    if (!courseId || !firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "Course, first name, last name, and email are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Verify course exists and is published
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        status: true,
        maxStudents: true,
        enrollmentCount: true,
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    if (course.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "This course is not currently accepting enrollments" },
        { status: 400 }
      );
    }

    // Check capacity
    if (course.maxStudents && course.enrollmentCount >= course.maxStudents) {
      return NextResponse.json(
        { error: "This course is full. Please try another course or check back later." },
        { status: 400 }
      );
    }

    // Check for duplicate enrollment
    const existingEnrollment = await prisma.courseEnrollment.findFirst({
      where: {
        courseId,
        guestEmail: email,
        status: { in: ["ENROLLED", "WAITLISTED"] },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: "You are already enrolled in this course" },
        { status: 400 }
      );
    }

    // Determine status
    const isWaitlisted =
      course.maxStudents &&
      course.enrollmentCount >= course.maxStudents;
    const status = isWaitlisted ? "WAITLISTED" : "ENROLLED";

    // Create enrollment
    const enrollment = await prisma.courseEnrollment.create({
      data: {
        courseId,
        guestName: `${firstName} ${lastName}`,
        guestEmail: email,
        guestPhone: phone || null,
        notes: notes || null,
        status,
      },
    });

    // Increment enrollment count
    if (status === "ENROLLED") {
      await prisma.course.update({
        where: { id: courseId },
        data: { enrollmentCount: { increment: 1 } },
      });
    }

    return NextResponse.json(
      {
        enrollment: { id: enrollment.id, status: enrollment.status },
        message:
          status === "WAITLISTED"
            ? "You have been added to the waitlist. We will notify you when a spot opens up."
            : "Enrollment successful! Check your email for confirmation details.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[SCHOOL_ENROLL_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to process enrollment" },
      { status: 500 }
    );
  }
}
