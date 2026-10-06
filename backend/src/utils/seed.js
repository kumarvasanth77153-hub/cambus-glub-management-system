import 'dotenv/config';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { College } from '../models/College.js';
import { User } from '../models/User.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { Club } from '../models/Club.js';
import { ClubMembership } from '../models/ClubMembership.js';
import { Activity } from '../models/Activity.js';
import { ActivitySchedule } from '../models/ActivitySchedule.js';
import { Event } from '../models/Event.js';
import { EventRegistration } from '../models/EventRegistration.js';
import { AttendanceSession } from '../models/AttendanceSession.js';
import { AttendanceRecord } from '../models/AttendanceRecord.js';
import { PointTransaction } from '../models/PointTransaction.js';
import { Certificate } from '../models/Certificate.js';
import { Achievement } from '../models/Achievement.js';
import { Notification } from '../models/Notification.js';

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/club_management';
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB:', mongoUri);

    // Clear existing collections
    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      College.deleteMany({}),
      User.deleteMany({}),
      StudentProfile.deleteMany({}),
      Club.deleteMany({}),
      ClubMembership.deleteMany({}),
      Activity.deleteMany({}),
      ActivitySchedule.deleteMany({}),
      Event.deleteMany({}),
      EventRegistration.deleteMany({}),
      AttendanceSession.deleteMany({}),
      AttendanceRecord.deleteMany({}),
      PointTransaction.deleteMany({}),
      Certificate.deleteMany({}),
      Achievement.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    // 1. Create College
    console.log('[Seed] Creating College...');
    const college = await College.create({
      name: 'National Engineering College, Kovilpatti',
      domain: 'nec.edu.in',
      status: true,
    });

    // 2. Create Platform Admin
    console.log('[Seed] Creating Platform Admin...');
    await User.create({
      name: 'Platform Admin',
      first_name: 'Platform',
      last_name: 'Admin',
      email: 'platform@campusclub.com',
      password: 'demo123',
      role: 'PLATFORM_ADMIN',
      isActive: true,
    });

    // 3. Create College Admin
    console.log('[Seed] Creating College Admin...');
    const collegeAdmin = await User.create({
      name: 'Dr. College Administrator',
      first_name: 'College',
      last_name: 'Admin',
      email: 'admin@nec.edu.in',
      password: 'demo123',
      role: 'COLLEGE_ADMIN',
      college: college._id,
      isActive: true,
    });

    // 4. Create Faculty Coordinator
    console.log('[Seed] Creating Faculty Coordinator...');
    const faculty = await User.create({
      name: 'Prof. S. Ramanathan',
      first_name: 'S.',
      last_name: 'Ramanathan',
      email: 'faculty@nec.edu.in',
      password: 'demo123',
      role: 'FACULTY_COORDINATOR',
      college: college._id,
      isActive: true,
    });

    // 5. Create 4 Clubs (NSS, NCC, Yoga Club, Eco Club)
    console.log('[Seed] Creating Clubs and Club Admins...');
    const clubsData = [
      {
        name: 'NSS',
        category: 'SOCIAL_SERVICE',
        adminEmail: 'nss_admin@nec.edu.in',
        adminName: 'NSS Coordinator',
        description: 'National Service Scheme - Not Me But You. Dedicated to community service, blood donation, and rural development.',
      },
      {
        name: 'NCC',
        category: 'OTHER',
        adminEmail: 'ncc_admin@nec.edu.in',
        adminName: 'NCC Officer',
        description: 'National Cadet Corps - Unity and Discipline. Developing character, comradeship, and leadership through rigorous training.',
      },
      {
        name: 'Yoga Club',
        category: 'HEALTH',
        adminEmail: 'yogaclub_admin@nec.edu.in',
        adminName: 'Yoga Instructor',
        description: 'Promoting physical flexibility, mental serenity, mindfulness, and healthy student lifestyles.',
      },
      {
        name: 'Eco Club',
        category: 'ENVIRONMENT',
        adminEmail: 'ecoclub_admin@nec.edu.in',
        adminName: 'Eco Officer',
        description: 'Environmental awareness, green campus initiatives, tree plantation, and waste management.',
      },
    ];

    const clubMap = {};

    for (const cData of clubsData) {
      const clubAdmin = await User.create({
        name: cData.adminName,
        first_name: cData.adminName.split(' ')[0],
        last_name: cData.adminName.split(' ')[1] || 'Admin',
        email: cData.adminEmail,
        password: 'demo123',
        role: 'CLUB_ADMIN',
        college: college._id,
        isActive: true,
      });

      const club = await Club.create({
        name: cData.name,
        college: college._id,
        description: cData.description,
        category: cData.category,
        admins: [clubAdmin._id],
        coordinators: [faculty._id],
        status: true,
      });

      clubMap[cData.name] = { club, admin: clubAdmin };
    }

    // 6. Create Students
    console.log('[Seed] Creating Students and StudentProfiles...');
    const studentsData = [
      { email: 'student1@nec.edu.in', first_name: 'Vasanth', last_name: 'Kumar', roll: '2023001', dept: 'CSE', year: 2, section: 'A' },
      { email: 'student2@nec.edu.in', first_name: 'Karthik', last_name: 'Raja', roll: '2023002', dept: 'ECE', year: 2, section: 'B' },
      { email: 'student3@nec.edu.in', first_name: 'Priya', last_name: 'Dharshini', roll: '2023003', dept: 'MECH', year: 3, section: 'A' },
    ];

    const studentList = [];
    for (const s of studentsData) {
      const studentUser = await User.create({
        name: `${s.first_name} ${s.last_name}`,
        first_name: s.first_name,
        last_name: s.last_name,
        email: s.email,
        password: 'demo123',
        role: 'STUDENT',
        college: college._id,
        isActive: true,
      });

      const profile = await StudentProfile.create({
        user: studentUser._id,
        college: college._id,
        roll_number: s.roll,
        department: s.dept,
        year: s.year,
        section: s.section,
        total_points: 0,
      });

      studentList.push({ user: studentUser, profile });
    }

    const s1 = studentList[0].user;
    const s2 = studentList[1].user;
    const s3 = studentList[2].user;

    // 7. Club Memberships
    console.log('[Seed] Creating Club Memberships...');
    await ClubMembership.create([
      { student: s1._id, club: clubMap['Yoga Club'].club._id, college: college._id, status: 'APPROVED', joined_date: new Date('2026-01-10') },
      { student: s1._id, club: clubMap['NSS'].club._id, college: college._id, status: 'APPROVED', joined_date: new Date('2026-01-15') },
      { student: s2._id, club: clubMap['NCC'].club._id, college: college._id, status: 'APPROVED', joined_date: new Date('2026-01-12') },
      { student: s2._id, club: clubMap['Eco Club'].club._id, college: college._id, status: 'APPROVED', joined_date: new Date('2026-01-20') },
      { student: s3._id, club: clubMap['NSS'].club._id, college: college._id, status: 'APPROVED', joined_date: new Date('2026-02-01') },
      { student: s3._id, club: clubMap['Yoga Club'].club._id, college: college._id, status: 'PENDING' },
    ]);

    // 8. Activities and Schedules (Non-daily schedules: Weekly, Twice a Week, etc.)
    console.log('[Seed] Creating Activities and Schedules...');
    // Yoga Practice: Weekly on Monday 06:00 - 07:30
    const yogaActivity = await Activity.create({
      club: clubMap['Yoga Club'].club._id,
      college: college._id,
      title: 'Morning Asana & Pranayama Practice',
      description: 'Weekly morning yoga and breathwork session for core wellness and mental clarity.',
      category: 'Health & Wellness',
      created_by: clubMap['Yoga Club'].admin._id,
    });
    await ActivitySchedule.create({
      activity: yogaActivity._id,
      club: clubMap['Yoga Club'].club._id,
      college: college._id,
      day_of_week: 'MONDAY',
      start_time: '06:00',
      end_time: '07:30',
      venue: 'Indoor Sports Hall / Meditation Centre',
    });

    // NSS Meeting: Twice a Week on Tuesday + Friday
    const nssActivity = await Activity.create({
      club: clubMap['NSS'].club._id,
      college: college._id,
      title: 'Bi-Weekly Social Action Forum',
      description: 'Planning community drives, village survey outreach, and literacy initiatives.',
      category: 'Community Engagement',
      created_by: clubMap['NSS'].admin._id,
    });
    await ActivitySchedule.create([
      {
        activity: nssActivity._id,
        club: clubMap['NSS'].club._id,
        college: college._id,
        day_of_week: 'TUESDAY',
        start_time: '16:30',
        end_time: '18:00',
        venue: 'NSS Seminar Hall',
      },
      {
        activity: nssActivity._id,
        club: clubMap['NSS'].club._id,
        college: college._id,
        day_of_week: 'FRIDAY',
        start_time: '16:30',
        end_time: '18:00',
        venue: 'NSS Seminar Hall',
      },
    ]);

    // Eco Club Activity: Three times a week (Monday, Wednesday, Friday)
    const ecoActivity = await Activity.create({
      club: clubMap['Eco Club'].club._id,
      college: college._id,
      title: 'Campus Botanical Garden & Compost Audit',
      description: 'Field inspection of composting pits and indigenous flora preservation.',
      category: 'Sustainability',
      created_by: clubMap['Eco Club'].admin._id,
    });
    await ActivitySchedule.create([
      {
        activity: ecoActivity._id,
        club: clubMap['Eco Club'].club._id,
        college: college._id,
        day_of_week: 'WEDNESDAY',
        start_time: '15:30',
        end_time: '17:00',
        venue: 'NEC Herbal Garden',
      },
    ]);

    // Also add a schedule for TODAY's day of week so the Student Dashboard always shows an active activity!
    const daysArr = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const currentDay = daysArr[new Date().getDay()];
    await ActivitySchedule.create({
      activity: yogaActivity._id,
      club: clubMap['Yoga Club'].club._id,
      college: college._id,
      day_of_week: currentDay,
      start_time: '07:00',
      end_time: '08:30',
      venue: 'Yoga Centre Hall A',
    });

    // 9. Events
    console.log('[Seed] Creating Events...');
    const event1 = await Event.create({
      club: clubMap['NSS'].club._id,
      college: college._id,
      title: 'Mega Blood Donation Camp 2026',
      description: 'Annual college-wide blood donation drive organized in partnership with Kovilpatti District Hospital.',
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // in 5 days
      start_time: '09:00',
      end_time: '15:00',
      venue: 'Main Auditorium',
      maximum_participants: 200,
      registration_start: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      registration_end: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      approval_status: 'APPROVED',
      status: 'OPEN',
      created_by: clubMap['NSS'].admin._id,
    });

    const event2 = await Event.create({
      club: clubMap['Yoga Club'].club._id,
      college: college._id,
      title: 'Surya Namaskar 108 Challenge',
      description: 'Challenging session of 108 continuous Surya Namaskars accompanied by yogic chanting and breathing techniques.',
      date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // in 10 days
      start_time: '06:00',
      end_time: '08:30',
      venue: 'College Open Ground',
      maximum_participants: 100,
      registration_start: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      registration_end: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      approval_status: 'APPROVED',
      status: 'OPEN',
      created_by: clubMap['Yoga Club'].admin._id,
    });

    const event3 = await Event.create({
      club: clubMap['Eco Club'].club._id,
      college: college._id,
      title: 'Tree Plantation & Miyawaki Forest Drive',
      description: 'Planting 500 indigenous tree saplings across the college perimeter to create a micro-forest canopy.',
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      start_time: '08:00',
      end_time: '12:00',
      venue: 'North Campus Perimeter',
      maximum_participants: 150,
      registration_start: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      registration_end: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      approval_status: 'APPROVED',
      status: 'OPEN',
      created_by: clubMap['Eco Club'].admin._id,
    });

    // 10. Event Registrations
    console.log('[Seed] Creating Event Registrations...');
    await EventRegistration.create([
      { event: event1._id, student: s1._id, club: clubMap['NSS'].club._id, college: college._id, status: 'REGISTERED' },
      { event: event2._id, student: s1._id, club: clubMap['Yoga Club'].club._id, college: college._id, status: 'REGISTERED' },
      { event: event1._id, student: s3._id, club: clubMap['NSS'].club._id, college: college._id, status: 'REGISTERED' },
    ]);

    // 11. Attendance Sessions with QR tokens & Records
    console.log('[Seed] Creating Attendance Sessions & Records...');
    const attSession = await AttendanceSession.create({
      club: clubMap['Yoga Club'].club._id,
      college: college._id,
      activity: yogaActivity._id,
      qr_token: '11111111-2222-3333-4444-555555555555',
      created_by: clubMap['Yoga Club'].admin._id,
      is_active: true,
      expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000),
    });

    await AttendanceRecord.create([
      { session: attSession._id, student: s1._id, club: clubMap['Yoga Club'].club._id, college: college._id, status: 'PRESENT', timestamp: new Date() },
    ]);

    // 12. Point Transactions (Automatically updates StudentProfile.total_points)
    console.log('[Seed] Creating Point Transactions...');
    await PointTransaction.create([
      { student: s1._id, college: college._id, club: clubMap['Yoga Club'].club._id, points: 50, reason: 'Completed 10 Morning Yoga Sessions' },
      { student: s1._id, college: college._id, club: clubMap['NSS'].club._id, points: 60, reason: 'Blood Donation Drive Volunteer' },
      { student: s1._id, college: college._id, points: 30, reason: 'College Environmental Quiz Runner Up' },
      { student: s2._id, college: college._id, club: clubMap['NCC'].club._id, points: 100, reason: 'Best Cadet Award in State Camp' },
      { student: s2._id, college: college._id, club: clubMap['Eco Club'].club._id, points: 50, reason: 'Zero Waste Campus Initiative Leader' },
      { student: s3._id, college: college._id, club: clubMap['NSS'].club._id, points: 40, reason: 'Rural Literacy Campaign Volunteer' },
    ]);

    // 13. Achievements
    console.log('[Seed] Creating Achievements...');
    await Achievement.create([
      { name: 'Wellness Champion', description: 'Awarded for exceptional commitment to yogic discipline and peer guidance.', student: s1._id, club: clubMap['Yoga Club'].club._id, college: college._id, points: 50, badge_icon: 'Award' },
      { name: 'Service Vanguard', description: 'Awarded for exemplary NSS social work and voluntary service.', student: s1._id, club: clubMap['NSS'].club._id, college: college._id, points: 50, badge_icon: 'Star' },
      { name: 'Discipline Honours', description: 'Selected as platoon leader in NCC training camp.', student: s2._id, club: clubMap['NCC'].club._id, college: college._id, points: 100, badge_icon: 'Trophy' },
    ]);

    // 14. Certificates
    console.log('[Seed] Creating Certificates...');
    await Certificate.create([
      {
        student: s1._id,
        club: clubMap['NSS'].club._id,
        college: college._id,
        event: event1._id,
        type: 'Excellence in Social Service',
        verification_uuid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        issue_date: new Date('2026-02-15'),
      },
      {
        student: s1._id,
        club: clubMap['Yoga Club'].club._id,
        college: college._id,
        activity: yogaActivity._id,
        type: 'Mastery in Asana Practice',
        verification_uuid: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        issue_date: new Date('2026-03-01'),
      },
    ]);

    // 15. Announcements
    console.log('[Seed] Creating Announcements...');
    await Notification.create([
      {
        title: 'Welcome to Academic Year 2026-27 Club Extravaganza',
        content: 'All clubs have opened their enrollment for the semester. Students can apply to their favorite clubs directly.',
        type: 'COLLEGE_ANNOUNCEMENT',
        college: college._id,
        created_by: collegeAdmin._id,
      },
      {
        title: 'Morning Yoga Batch Schedule & Guidelines',
        content: 'Yoga Club sessions start at 06:00 AM sharp at the Indoor Hall. Please carry your personal yoga mat.',
        type: 'CLUB_ANNOUNCEMENT',
        college: college._id,
        club: clubMap['Yoga Club'].club._id,
        created_by: clubMap['Yoga Club'].admin._id,
      },
      {
        title: 'Volunteers Wanted for Blood Donation Drive',
        content: 'NSS is inviting enthusiastic volunteers to coordinate with the district medical team for the upcoming drive.',
        type: 'CLUB_ANNOUNCEMENT',
        college: college._id,
        club: clubMap['NSS'].club._id,
        created_by: clubMap['NSS'].admin._id,
      },
      {
        title: 'Campus Sapling Distribution',
        content: 'Eco Club is distributing free herbal saplings to all hostel residents this Friday afternoon.',
        type: 'CLUB_ANNOUNCEMENT',
        college: college._id,
        club: clubMap['Eco Club'].club._id,
        created_by: clubMap['Eco Club'].admin._id,
      },
    ]);

    console.log('\n========================================');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('========================================');
    console.log('College Domain: nec.edu.in');
    console.log('All accounts share password: demo123\n');
    console.log('Demo Accounts:');
    console.log('1. Platform Admin: platform@campusclub.com');
    console.log('2. College Admin:  admin@nec.edu.in');
    console.log('3. Yoga Admin:     yogaclub_admin@nec.edu.in');
    console.log('4. NSS Admin:      nss_admin@nec.edu.in');
    console.log('5. Faculty Coord:  faculty@nec.edu.in');
    console.log('6. Student 1:      student1@nec.edu.in');
    console.log('7. Student 2:      student2@nec.edu.in');
    console.log('8. Student 3:      student3@nec.edu.in');
    console.log('========================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
