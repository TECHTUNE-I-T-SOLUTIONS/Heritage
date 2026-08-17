/**
 * Heritage Club — database seed.
 *
 * Usage: `npm run seed`
 * Requires MONGODB_URI in .env / .env.local (added by you).
 * This wipes and repopulates the core collections with realistic sample data.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import mongoose, { type HydratedDocument } from 'mongoose'
import { hashPassword } from '../lib/auth'
import { connectToDatabase } from '../lib/db'
import { User, type IUser } from '../models/User'
import { Cohort } from '../models/Cohort'
import { Pillar, Module, Lesson, LessonProgress, type IPillar, type ILesson } from '../models/Curriculum'
import { Quiz, QuizAttempt } from '../models/Quiz'
import { Assignment, Submission } from '../models/Assignment'
import { XpEvent } from '../models/Gamification'
import { Subscription, Payment, PLANS } from '../models/Billing'
import { Testimonial, SiteContent, Notification } from '../models/Content'

// --- load env vars if not already present (tsx doesn't auto-load .env) ---
function loadEnv() {
  if (process.env.MONGODB_URI) return
  for (const file of ['.env.local', '.env']) {
    try {
      const raw = readFileSync(resolve(process.cwd(), file), 'utf8')
      for (const line of raw.split('\n')) {
        const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/)
        if (m && !process.env[m[1]]) {
          process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
        }
      }
    } catch {
      /* file not present — ignore */
    }
  }
}

const PASSWORD = 'Passw0rd!'
const now = new Date()
const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000)
const daysFromNow = (n: number) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000)
const pick = <T>(arr: T[], i: number) => arr[i % arr.length]

async function seed() {
  loadEnv()
  await connectToDatabase()
  console.log('Connected. Clearing existing data…')

  await Promise.all([
    User.deleteMany({}),
    Cohort.deleteMany({}),
    Pillar.deleteMany({}),
    Module.deleteMany({}),
    Lesson.deleteMany({}),
    LessonProgress.deleteMany({}),
    Quiz.deleteMany({}),
    QuizAttempt.deleteMany({}),
    Assignment.deleteMany({}),
    Submission.deleteMany({}),
    XpEvent.deleteMany({}),
    Subscription.deleteMany({}),
    Payment.deleteMany({}),
    Testimonial.deleteMany({}),
    SiteContent.deleteMany({}),
    Notification.deleteMany({}),
  ])

  const passwordHash = await hashPassword(PASSWORD)

  // --- Admin ---
  const admin = await User.create({
    role: 'admin', status: 'active', email: 'admin@heritageclub.app',
    passwordHash, fullName: 'Amara Okafor', preferredName: 'Amara',
    country: 'Canada', timezone: 'America/Toronto',
  })

  // --- Educators ---
  const educators = await User.create([
    { role: 'educator', status: 'active', email: 'zainab@heritageclub.app', passwordHash, fullName: 'Zainab Bello', preferredName: 'Zainab', country: 'Canada', timezone: 'America/Toronto', bio: 'Yoruba language educator and storyteller with 8 years teaching diaspora children.' },
    { role: 'educator', status: 'active', email: 'kwame@heritageclub.app', passwordHash, fullName: 'Kwame Mensah', preferredName: 'Kwame', country: 'Canada', timezone: 'America/Toronto', bio: 'Historian focused on West African kingdoms and oral tradition.' },
    { role: 'educator', status: 'active', email: 'thandiwe@heritageclub.app', passwordHash, fullName: 'Thandiwe Ndlovu', preferredName: 'Thandiwe', country: 'Canada', timezone: 'America/Vancouver', bio: 'Creative arts facilitator specialising in music, dance, and visual heritage.' },
  ])

  // --- Cohorts ---
  const cohorts = await Cohort.create([
    { code: 'HC-EXPL-01', name: 'Explorers · Saturdays', minAge: 6, maxAge: 9, capacity: 8, educator: educators[0]._id, schedule: 'Saturdays · 10:00 EST', timezone: 'America/Toronto', status: 'active', meetingLink: 'https://meet.heritageclub.app/expl-01' },
    { code: 'HC-PATH-01', name: 'Pathfinders · Sundays', minAge: 10, maxAge: 13, capacity: 8, educator: educators[1]._id, schedule: 'Sundays · 11:00 EST', timezone: 'America/Toronto', status: 'active', meetingLink: 'https://meet.heritageclub.app/path-01' },
    { code: 'HC-GRIOT-01', name: 'Griots · Saturdays', minAge: 14, maxAge: 17, capacity: 8, educator: educators[2]._id, schedule: 'Saturdays · 13:00 PST', timezone: 'America/Vancouver', status: 'forming', meetingLink: 'https://meet.heritageclub.app/griot-01' },
  ])

  await User.updateOne({ _id: educators[0]._id }, { $set: { assignedCohorts: [cohorts[0]._id] } })
  await User.updateOne({ _id: educators[1]._id }, { $set: { assignedCohorts: [cohorts[1]._id] } })
  await User.updateOne({ _id: educators[2]._id }, { $set: { assignedCohorts: [cohorts[2]._id] } })

  // --- Parents + children ---
  const parentsData = [
    { name: 'Chidi Eze', email: 'chidi@example.com', plan: 'family2' as const, kids: [{ name: 'Ada Eze', age: 8, cohort: 0 }, { name: 'Emeka Eze', age: 11, cohort: 1 }] },
    { name: 'Fatima Diallo', email: 'fatima@example.com', plan: 'individual' as const, kids: [{ name: 'Mariam Diallo', age: 7, cohort: 0 }] },
    { name: 'Kofi Asante', email: 'kofi@example.com', plan: 'family3' as const, kids: [{ name: 'Yaa Asante', age: 9, cohort: 0 }, { name: 'Kwabena Asante', age: 12, cohort: 1 }, { name: 'Abena Asante', age: 15, cohort: 2 }] },
  ]

  const allStudents: HydratedDocument<IUser>[] = []
  const parents: HydratedDocument<IUser>[] = []

  for (const p of parentsData) {
    const parent = await User.create({
      role: 'parent', status: 'active', email: p.email, passwordHash,
      fullName: p.name, preferredName: p.name.split(' ')[0], country: 'Canada', timezone: 'America/Toronto',
    })
    parents.push(parent)

    for (const kid of p.kids) {
      const xp = 200 + Math.floor(Math.random() * 1800)
      const student = await User.create({
        role: 'student', status: 'active', email: `${kid.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        passwordHash, fullName: kid.name, preferredName: kid.name.split(' ')[0], age: kid.age,
        parent: parent._id, cohort: cohorts[kid.cohort]._id, planKey: p.plan,
        xp, level: Math.max(1, Math.floor(xp / 500) + 1), streak: Math.floor(Math.random() * 12),
        country: 'Canada', timezone: 'America/Toronto',
      })
      allStudents.push(student)
    }

    // --- Subscription + payments for this parent ---
    const plan = PLANS[p.plan]
    const subscription = await Subscription.create({
      account: parent._id, planKey: plan.key, price: plan.price, currency: 'CAD',
      childrenCount: p.kids.length, status: 'active',
      currentPeriodStart: daysAgo(10), currentPeriodEnd: daysFromNow(20), cancelAtPeriodEnd: false,
      provider: 'manual',
    })
    for (let m = 0; m < 3; m++) {
      await Payment.create({
        account: parent._id, subscription: subscription._id, amount: plan.price, currency: 'CAD',
        status: 'succeeded', invoiceNumber: `HC-${1000 + parents.length * 10 + m}`,
        provider: 'manual', paidAt: daysAgo(10 + m * 30),
      })
    }
  }

  console.log(`Created ${parents.length} parents and ${allStudents.length} students.`)

  // --- Curriculum: pillars → modules → lessons ---
  const pillarDefs = [
    { title: 'Language & Oral Tradition', slug: 'language', description: 'Greetings, proverbs, and everyday speech across African languages.', order: 1 },
    { title: 'Stories & History', slug: 'stories-history', description: 'Kingdoms, heroes, and the oral histories that shaped a continent.', order: 2 },
    { title: 'Values & Symbols', slug: 'values-symbols', description: 'Adinkra, kente, totems, and the wisdom encoded in cultural symbols.', order: 3 },
    { title: 'Creative Expression', slug: 'creative-expression', description: 'Music, dance, food, and craft as living heritage.', order: 4 },
  ]
  const lessonTitles: Record<string, string[]> = {
    language: ['Greetings & Respect', 'Counting & Numbers', 'Family & Kinship Words', 'Proverbs & Their Meaning'],
    'stories-history': ['The Kingdom of Mali', 'Anansi the Storyteller', 'Great Zimbabwe', 'Queen Amina of Zazzau'],
    'values-symbols': ['Adinkra Symbols', 'The Meaning of Kente', 'Ubuntu: I Am Because We Are', 'Totems & Clans'],
    'creative-expression': ['Rhythms of the Drum', 'Traditional Dance', 'Foods That Tell Stories', 'Beadwork & Craft'],
  }

  const allLessons: HydratedDocument<ILesson>[] = []
  const pillars: HydratedDocument<IPillar>[] = []
  for (const pd of pillarDefs) {
    const pillar = await Pillar.create({ ...pd, status: 'published' })
    pillars.push(pillar)
    for (let mi = 0; mi < 2; mi++) {
      const mod = await Module.create({ pillar: pillar._id, title: `${pd.title} · Module ${mi + 1}`, order: mi, status: 'published' })
      const titles = lessonTitles[pd.slug]
      for (let li = 0; li < 2; li++) {
        const idx = mi * 2 + li
        const lesson = await Lesson.create({
          pillar: pillar._id, module: mod._id, week: idx + 1, order: li,
          title: titles[idx] ?? `${pd.title} Lesson ${idx + 1}`,
          summary: `An engaging introduction to ${titles[idx] ?? pd.title}.`,
          content: `In this lesson we explore ${titles[idx] ?? pd.title} through stories, images, and interactive activities designed for young learners in the diaspora.`,
          resources: [{ kind: 'text', title: 'Lesson notes', body: 'Key vocabulary and discussion prompts.' }],
          xpReward: 50, status: 'published',
        })
        allLessons.push(lesson)
      }
    }
  }
  console.log(`Created ${pillars.length} pillars and ${allLessons.length} lessons.`)

  // --- Quizzes (one per educator/pillar) ---
  const quizzes = await Quiz.create([
    {
      title: 'Greetings & Respect', description: 'Test your knowledge of African greetings.',
      pillar: pillars[0]._id, createdBy: educators[0]._id, xpReward: 100, status: 'published',
      questions: [
        { prompt: 'In Yoruba, how do you greet an elder in the morning?', options: ['E kaaro', 'Sannu', 'Jambo', 'Molo'], correctIndex: 0, points: 1 },
        { prompt: 'What does "Ubuntu" broadly mean?', options: ['Good morning', 'I am because we are', 'Thank you', 'Welcome'], correctIndex: 1, points: 1 },
        { prompt: 'Which is a sign of respect when greeting elders in many cultures?', options: ['Shouting', 'Bowing or kneeling', 'Ignoring them', 'Pointing'], correctIndex: 1, points: 1 },
      ],
    },
    {
      title: 'West African Kingdoms', description: 'How much do you know about great kingdoms?',
      pillar: pillars[1]._id, createdBy: educators[1]._id, xpReward: 120, status: 'published',
      questions: [
        { prompt: 'Mansa Musa ruled which empire?', options: ['Songhai', 'Mali', 'Ghana', 'Benin'], correctIndex: 1, points: 1 },
        { prompt: 'Queen Amina was a warrior queen of?', options: ['Zazzau', 'Kongo', 'Axum', 'Nubia'], correctIndex: 0, points: 1 },
      ],
    },
  ])
  console.log(`Created ${quizzes.length} quizzes.`)

  // --- Assignments ---
  const assignments = await Assignment.create([
    { title: 'My Family Greeting', instructions: 'Record or write a greeting in your heritage language and share who taught it to you.', pillar: pillars[0]._id, createdBy: educators[0]._id, dueDate: daysFromNow(7), allowedTypes: ['document', 'audio', 'link'], xpReward: 150, status: 'published' },
    { title: 'Draw an Adinkra Symbol', instructions: 'Choose an Adinkra symbol, draw it, and explain its meaning in a few sentences.', pillar: pillars[2]._id, createdBy: educators[2]._id, dueDate: daysFromNow(10), allowedTypes: ['image', 'document'], xpReward: 150, status: 'published' },
  ])
  console.log(`Created ${assignments.length} assignments.`)

  // --- Student progress: lesson completions, quiz attempts, submissions, XP events ---
  for (let i = 0; i < allStudents.length; i++) {
    const student = allStudents[i]
    const completeCount = 3 + (i % 4)
    for (let l = 0; l < completeCount && l < allLessons.length; l++) {
      const lesson = allLessons[l]
      await LessonProgress.create({ student: student._id, lesson: lesson._id, completed: true, completedAt: daysAgo(completeCount - l) })
      await XpEvent.create({ student: student._id, source: 'lesson', amount: lesson.xpReward, reference: lesson._id, note: `Completed ${lesson.title}` })
    }

    // one quiz attempt
    const quiz = pick(quizzes, i)
    const totalPoints = quiz.questions.reduce((s, q) => s + q.points, 0)
    const answers = quiz.questions.map((q, qi) => (qi % 3 === 0 ? (q.correctIndex + 1) % q.options.length : q.correctIndex))
    const score = quiz.questions.reduce((s, q, qi) => s + (answers[qi] === q.correctIndex ? q.points : 0), 0)
    const percentage = Math.round((score / totalPoints) * 100)
    const xpEarned = Math.round((quiz.xpReward * percentage) / 100)
    await QuizAttempt.create({ quiz: quiz._id, student: student._id, answers, score, totalPoints, percentage, xpEarned, submittedAt: daysAgo(2) })
    if (xpEarned > 0) await XpEvent.create({ student: student._id, source: 'quiz', amount: xpEarned, reference: quiz._id, note: `Scored ${percentage}% on ${quiz.title}` })

    // submission for first assignment (varied moderation states)
    if (i % 2 === 0) {
      const modStates = ['approved', 'pending', 'flagged'] as const
      await Submission.create({
        assignment: assignments[0]._id, student: student._id,
        note: 'Here is my family greeting recording.',
        files: [{ kind: 'audio', name: 'greeting.mp3', url: 'https://files.heritageclub.app/sample-greeting.mp3' }],
        status: i % 4 === 0 ? 'graded' : 'submitted',
        moderation: pick([...modStates], i),
        grade: i % 4 === 0 ? 88 : undefined,
        feedback: i % 4 === 0 ? 'Beautiful pronunciation — well done!' : undefined,
        gradedBy: i % 4 === 0 ? educators[0]._id : undefined,
        submittedAt: daysAgo(3),
      })
    }
  }
  console.log('Created lesson progress, quiz attempts, and submissions.')

  // --- Testimonials ---
  await Testimonial.create([
    { authorName: 'Ngozi A.', relationship: 'Parent of two', quote: 'My children finally have words for who they are. Heritage Club gave them pride and language.', rating: 5, published: true },
    { authorName: 'Samuel O.', relationship: 'Parent', quote: 'The educators are warm and the stories are unforgettable. Saturday mornings are now the highlight of our week.', rating: 5, published: true },
    { authorName: 'Aisha M.', relationship: 'Parent of three', quote: 'Worth every dollar. My kids ask to log in!', rating: 5, published: false },
  ])

  // --- Site content ---
  await SiteContent.create([
    { key: 'home.hero.title', value: 'Roots that travel with them.', updatedBy: admin._id },
    { key: 'home.hero.subtitle', value: 'Live, small-group classes teaching African heritage to children in the diaspora.', updatedBy: admin._id },
    { key: 'contact.email', value: 'hello@heritageclub.app', updatedBy: admin._id },
    { key: 'social', value: { instagram: 'https://instagram.com/heritageclub', youtube: 'https://youtube.com/@heritageclub' }, updatedBy: admin._id },
  ])

  // --- Welcome notifications ---
  for (const parent of parents) {
    await Notification.create({ user: parent._id, type: 'announcement', title: 'Welcome to Heritage Club!', body: 'Your family journey begins. Check your children\'s cohort schedule.', read: false })
  }
  for (const student of allStudents) {
    await Notification.create({ user: student._id, type: 'class_reminder', title: 'Your next class', body: 'See you Saturday — bring your curiosity!', read: false })
  }

  console.log('Created testimonials, site content, and notifications.')
  console.log('\nSample logins (password for all): ' + PASSWORD)
  console.log('  Admin:    admin@heritageclub.app')
  console.log('  Educator: zainab@heritageclub.app')
  console.log('  Parent:   chidi@example.com')
  console.log('  Student:  ada.eze@example.com')

  void pick
}

seed()
  .then(() => { console.log('✅ Seed complete.'); return mongoose.disconnect() })
  .then(() => process.exit(0))
  .catch((err) => { console.error('❌ Seed failed:', err); return mongoose.disconnect().finally(() => process.exit(1)) })
