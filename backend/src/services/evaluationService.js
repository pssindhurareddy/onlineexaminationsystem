const { Exam, Question, Attempt, Result } = require('../models');

class EvaluationService {
  static async evaluate(userId, attemptId, examId, answers) {
    const exam = await Exam.findByPk(examId, { include: [Question] });
    const attempt = await Attempt.findByPk(attemptId);
    
    if (!attempt || attempt.status === 'completed') throw new Error('Attempt already submitted or invalid');
    
    let totalScore = 0;
    
    // Iterate through DB correct options and match recursively
    for (const q of exam.Questions) {
      const studentAnswer = answers[q.id];
      if (studentAnswer && Array.isArray(studentAnswer)) {
         if (q.type === 'word') {
            const studentWord = String(studentAnswer[0] || '').toLowerCase().trim();
            const correctWord = String(q.correct_answer[0] || '').toLowerCase().trim();
            if (studentWord === correctWord) totalScore += q.marks;
         } else {
            const sortedStudent = [...studentAnswer].sort();
            const sortedCorrect = [...q.correct_answer].sort();
            if (JSON.stringify(sortedStudent) === JSON.stringify(sortedCorrect)) {
               totalScore += q.marks;
            }
         }
      }
    }
    
    const isPassed = totalScore >= exam.pass_marks;
    
    attempt.end_time = new Date();
    attempt.status = 'completed';
    await attempt.save();

    // Create Official Certificate Record
    const result = await Result.create({
      user_id: userId,
      exam_id: examId,
      attempt_id: attemptId,
      score: totalScore,
      passed: isPassed
    });

    return { score: totalScore, passed: isPassed, totalMarks: exam.total_marks };
  }
}
module.exports = EvaluationService;
