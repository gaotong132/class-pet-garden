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
  // 获取所有非游客用户
  const teachers = db.prepare(`
    SELECT id, username, created_at, is_admin
    FROM users
    WHERE is_guest = 0
    ORDER BY created_at DESC
  `).all()

  // 为每个老师获取班级和学生统计
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

export default router