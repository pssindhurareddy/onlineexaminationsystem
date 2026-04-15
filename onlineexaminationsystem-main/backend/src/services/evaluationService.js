const { Exam, Question, ExamAttempt, AttemptAnswer } = require('../models');

class EvaluationService {
  static async evaluate(userId, attemptId, examId, answers) {
    const exam = await Exam.findByPk(examId, { include: [Question] });
    const attempt = await ExamAttempt.findByPk(attemptId);

    if (!exam) throw new Error('Exam not found');
    if (!attempt || attempt.status === 'submitted') throw new Error('Attempt already submitted or invalid');

    let totalScore = 0;

    // Grade each question
    for (const q of exam.Questions) {
      const studentAnswer = answers[q.id];
      if (studentAnswer && Array.isArray(studentAnswer)) {
        if (q.type === 'word' || q.type === 'fill_blank') {
          const studentWord = String(studentAnswer[0] || '').toLowerCase().trim();
          const correctWord = String(q.correct_answer[0] || '').toLowerCase().trim();
          if (studentWord === correctWord) totalScore += q.marks;
        } else {
          // Convert everything to strings for comparison (handles numeric indexes)
          const sortedStudent = [...studentAnswer].map(String).sort();
          const sortedCorrect = [...q.correct_answer].map(String).sort();
          if (JSON.stringify(sortedStudent) === JSON.stringify(sortedCorrect)) {
            totalScore += q.marks;
          }
        }
      }

      // Save individual answer record
      try {
        await AttemptAnswer.create({
          attempt_id: attemptId,
          question_id: q.id,
          selected_answer: studentAnswer ? studentAnswer : null
        });
      } catch (e) {
        // Non-fatal: answer record may already exist
      }
    }

    const isPassed = totalScore >= exam.pass_marks;
    const percentage = exam.total_marks > 0 ? (totalScore / exam.total_marks) * 100 : 0;

    // Update the attempt record with results
    await attempt.update({
      status: 'submitted',
      submitted_at: new Date(),
      total_score: totalScore,
      percentage: parseFloat(percentage.toFixed(2)),
      time_taken_seconds: attempt.started_at
        ? Math.floor((new Date() - new Date(attempt.started_at)) / 1000)
        : null
    });

    return { score: totalScore, passed: isPassed, totalMarks: exam.total_marks, percentage };
  }
}

module.exports = EvaluationService;
