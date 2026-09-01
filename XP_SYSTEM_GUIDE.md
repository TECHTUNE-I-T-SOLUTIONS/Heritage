# Heritage Club XP System Guide

## Overview
The XP (Experience Points) system gamifies the learning experience by rewarding students for their engagement, progress, and consistency. XP accumulation leads to level progression and unlocks achievements.

## XP Sources and Calculation

### 1. Attendance XP
**Base Reward: 20 XP per session**

Students earn XP for attending live class sessions:
- **Present**: 20 XP
- **Late**: 20 XP (still rewarded for attending)
- **Absent**: 0 XP
- **Excused**: 0 XP

**Weekly Structure:**
- 2 sessions per week (Saturday & Sunday)
- 16 weeks total (4 months program)
- 32 total sessions possible
- Maximum attendance XP: 640 XP (32 sessions × 20 XP)

### 2. Streak Bonus XP
**Formula: `min(streak × 5, 50)` XP**

Students earn bonus XP for consecutive attendance:
- Streak of 2: 10 XP bonus
- Streak of 3: 15 XP bonus
- Streak of 4: 20 XP bonus
- ...
- Streak of 10+: 50 XP bonus (maximum)

**Streak Calculation:**
- Streak increases when attending consecutive sessions
- Consecutive means: Week 1 Session 1 → Week 1 Session 2 → Week 2 Session 1 → Week 2 Session 2
- Missing a session resets the streak to 1
- Only "present" or "late" attendance counts toward streak

### 3. Weekly Completion Bonus
**Reward: 50 XP per completed week**

Students earn bonus XP when they attend both sessions in a week:
- Must attend both Saturday and Sunday sessions
- Both sessions must be "present" or "late"
- Awarded immediately after the second session is marked
- Maximum weekly completion XP: 800 XP (16 weeks × 50 XP)

### 4. Monthly Milestone Bonus
**Reward: 100 XP per completed month**

Students earn milestone XP for completing full months:
- Awarded every 4 weeks (monthly milestone)
- Requires attendance in all 8 sessions of the month
- Maximum monthly milestone XP: 400 XP (4 months × 100 XP)

### 5. Quiz XP
**Variable: Based on quiz settings**

Students earn XP for completing quizzes:
- Base reward set by educator (typically 50-200 XP)
- Awarded upon quiz submission
- Percentage-based scaling can be applied
- Maximum quiz XP varies by curriculum

### 6. Assignment XP
**Variable: Based on assignment settings**

Students earn XP for completing assignments:
- Base reward set by educator (typically 100-300 XP)
- Awarded upon submission and approval
- Grade may influence final XP amount
- Maximum assignment XP varies by curriculum

### 7. Lesson Completion XP
**Base Reward: 50 XP per lesson**

Students earn XP for completing self-paced lessons:
- Awarded when lesson is marked complete
- Encourages independent learning
- Maximum lesson XP varies by curriculum

### 8. Manual XP Awards
**Variable: At educator discretion**

Educators can manually award XP for:
- Exceptional participation
- Extra effort
- Special achievements
- Makeup work
- Any other deserving activity

## Level Progression

**Formula: `level = floor(sqrt(xp / 100)) + 1`**

Levels are calculated based on total XP:
- Level 1: 0-99 XP
- Level 2: 100-399 XP  
- Level 3: 400-899 XP
- Level 4: 900-1599 XP
- Level 5: 1600-2499 XP
- And so on...

Each level requires progressively more XP, creating a satisfying progression curve.

## XP Calculation Examples

### Example 1: Perfect Attendance
**Student attends all 32 sessions:**
- Attendance XP: 32 × 20 = 640 XP
- Weekly completion: 16 × 50 = 800 XP
- Monthly milestones: 4 × 100 = 400 XP
- Streak bonuses (perfect streak): ~400 XP
- **Total from attendance: ~2,240 XP**

### Example 2: Good Attendance with Quizzes
**Student attends 28 sessions + completes 8 quizzes:**
- Attendance XP: 28 × 20 = 560 XP
- Weekly completion: 14 × 50 = 700 XP
- Monthly milestones: 3 × 100 = 300 XP
- Streak bonuses: ~200 XP
- Quiz XP: 8 × 100 = 800 XP
- **Total: ~2,560 XP**

### Example 3: Minimum Attendance
**Student attends 16 sessions (50%):**
- Attendance XP: 16 × 20 = 320 XP
- Weekly completion: 4 × 50 = 200 XP
- Monthly milestones: 1 × 100 = 100 XP
- Streak bonuses: ~50 XP
- **Total: ~670 XP**

## Curriculum Integration

### Pillar and Module Association
Attendance, quizzes, and assignments can be associated with specific curriculum elements:
- **Pillars**: Top-level categories (Language, Stories & History, Values & Symbols, Creative Expression)
- **Modules**: Sub-topics within pillars
- **Weeks**: Temporal organization (Week 1-16)
- **Sessions**: Specific class sessions (Session 1-2 per week)

This association helps track progress through the curriculum and ensures balanced coverage across all pillars.

## Attendance and Class Unlocking

### Progression System
The attendance system controls class unlocking through:
1. **Weekly Progress**: Completing both sessions unlocks the next week's content
2. **Pillar Completion**: Attending sessions associated with specific pillars
3. **Module Progress**: Tracking attendance by module within pillars

### Unlocking Logic
- Week 1 content is available from the start
- Week 2 unlocks after completing Week 1 both sessions
- Week 3 unlocks after completing Week 2 both sessions
- And so on...

This ensures students progress through the curriculum in a structured manner while allowing flexibility for catch-up.

## XP Tracking and Display

### Student Dashboard
Students can view their:
- Total XP
- Current level
- Progress to next level
- Current streak
- XP breakdown by source
- Recent XP gains

### Educator Dashboard
Educators can view:
- Student XP rankings
- Attendance rates
- Streak leaders
- XP distribution across class
- Individual student progress

## Best Practices for Educators

### Setting XP Rewards
- **Quizzes**: 50-200 XP based on difficulty
- **Assignments**: 100-300 XP based on effort required
- **Manual awards**: Use sparingly for special recognition
- **Keep rewards balanced** across all activities

### Monitoring Progress
- Review attendance rates weekly
- Check streak data for engagement patterns
- Use XP data to identify struggling students
- Celebrate milestones and achievements

### Curriculum Planning
- Associate each session with appropriate pillar/module
- Balance XP opportunities across all pillars
- Ensure quizzes and assignments complement attendance XP
- Plan for makeup opportunities if students miss sessions

## Technical Implementation

### Database Schema
XP events are tracked in the `XpEvent` collection:
- `student`: Reference to user
- `amount`: XP awarded
- `source`: Type of XP (attendance, quiz, assignment, etc.)
- `reference`: Related object ID (quiz, assignment, etc.)
- `note`: Description of the XP award
- `timestamp`: When XP was awarded

### API Endpoints
- `POST /api/educator/attendance` - Mark attendance and award XP
- `POST /api/educator/quizzes` - Create quiz with XP reward
- `POST /api/educator/assignments` - Create assignment with XP reward
- XP is automatically calculated and awarded through these endpoints

## Summary

The XP system is designed to:
1. **Encourage consistent attendance** through daily rewards and streaks
2. **Reward completion** through weekly and monthly bonuses
3. **Support curriculum progression** through pillar/module tracking
4. **Provide clear goals** through level progression
5. **Allow flexibility** through manual XP awards
6. **Create engagement** through gamification elements

Total potential XP from attendance alone: ~2,240 XP
Additional XP from quizzes, assignments, and lessons can significantly increase this total, creating a rich and rewarding learning experience.
