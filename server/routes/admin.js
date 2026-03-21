import { Router } from 'express'
import { db } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

// 管理员权限检查中间件
function adminMiddleware(req, res, next) {
  const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(req.userId)
  if (!user || !user.is_admin) {
    return res.status(403).json({ error: '需要管理员权限' })
  }
  next()
}

// 获取所有老师及其班级统计
router.get('/teachers', authMiddleware, adminMiddleware, (req, res) => {
  const teachers = db.prepare(`
    SELECT id, username, created_at, is_admin
    FROM users
    WHERE is_guest = 0
    ORDER BY created_at DESC
  `).all()

  const result = teachers.map(teacher => {
    const classes = db.prepare(`
      SELECT c.id, c.name,
             (SELECT count(*) FROM students s WHERE s.class_id = c.id) as student_count,
             (SELECT count(*) FROM evaluation_records e WHERE e.class_id = c.id) as eval_count
      FROM classes c
      WHERE c.user_id = ?
      ORDER BY student_count DESC
    `).all(teacher.id)

    const totalStudents = classes.reduce((sum, c) => sum + c.student_count, 0)
    const totalEvals = classes.reduce((sum, c) => sum + c.eval_count, 0)

    return {
      id: teacher.id,
      username: teacher.username,
      isAdmin: !!teacher.is_admin,
      createdAt: teacher.created_at,
      classCount: classes.length,
      totalStudents,
      totalEvals,
      classes
    }
  })

  res.json({ teachers: result })
})

// 获取系统统计概览
router.get('/stats', authMiddleware, adminMiddleware, (req, res) => {
  const stats = {
    teachers: db.prepare('SELECT count(*) as count FROM users WHERE is_guest = 0').get().count,
    classes: db.prepare('SELECT count(*) as count FROM classes').get().count,
    students: db.prepare('SELECT count(*) as count FROM students').get().count,
    evaluations: db.prepare('SELECT count(*) as count FROM evaluation_records').get().count,
    todayEvaluations: db.prepare(`
      SELECT count(*) as count FROM evaluation_records 
      WHERE date(timestamp/1000, 'unixepoch', 'localtime') = date('now', 'localtime')
    `).get().count
  }

  // 最近7天的评价统计
  const dailyStats = db.prepare(`
    SELECT date(timestamp/1000, 'unixepoch', 'localtime') as date, 
           count(*) as count 
    FROM evaluation_records 
    WHERE timestamp/1000 >= strftime('%s', 'now', '-7 days')
    GROUP BY date
    ORDER BY date DESC
  `).all()

  res.json({ stats, dailyStats })
})

// 获取近7天详细统计数据
router.get('/daily-stats', authMiddleware, adminMiddleware, (req, res) => {
  // 生成最近7天的日期列表
  const dates = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    dates.push(date.toISOString().slice(0, 10))
  }

  // 每天新增用户
  const newUsers = db.prepare(`
    SELECT date(created_at/1000, 'unixepoch', 'localtime') as date, count(*) as count
    FROM users
    WHERE is_guest = 0 AND created_at/1000 >= strftime('%s', 'now', '-7 days')
    GROUP BY date
  `).all()

  // 每天新增班级
  const newClasses = db.prepare(`
    SELECT date(created_at/1000, 'unixepoch', 'localtime') as date, count(*) as count
    FROM classes
    WHERE created_at/1000 >= strftime('%s', 'now', '-7 days')
    GROUP BY date
  `).all()

  // 每天新增学生
  const newStudents = db.prepare(`
    SELECT date(created_at/1000, 'unixepoch', 'localtime') as date, count(*) as count
    FROM students
    WHERE created_at/1000 >= strftime('%s', 'now', '-7 days')
    GROUP BY date
  `).all()

  // 每天评价数
  const evaluations = db.prepare(`
    SELECT date(timestamp/1000, 'unixepoch', 'localtime') as date, count(*) as count
    FROM evaluation_records
    WHERE timestamp/1000 >= strftime('%s', 'now', '-7 days')
    GROUP BY date
  `).all()

  // 转换为日期 -> 数量的映射
  const toMap = (arr) => {
    const map = {}
    arr.forEach(item => { map[item.date] = item.count })
    return map
  }

  const usersMap = toMap(newUsers)
  const classesMap = toMap(newClasses)
  const studentsMap = toMap(newStudents)
  const evalsMap = toMap(evaluations)

  // 组装结果，确保每天都有数据
  const result = dates.map(date => ({
    date,
    newUsers: usersMap[date] || 0,
    newClasses: classesMap[date] || 0,
    newStudents: studentsMap[date] || 0,
    evaluations: evalsMap[date] || 0
  }))

  res.json({ dailyStats: result })
})

export default router