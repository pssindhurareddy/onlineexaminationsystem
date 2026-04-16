const { Exam, Question, ExamAttempt, AttemptAnswer } = require('../models');

class EvaluationService {
  static async evaluate(userId, attemptId, examId, answers) {
    const exam = await Exam.findByPk(examId, { include: [Question] });
    const attempt = await ExamAttempt.findByPk(attemptId);

    if (!attempt || attempt.status !== 'in_progress') {
      throw new Error('Attempt already submitted or invalid');
    }

    let totalScore = 0;
    const answerRecords = [];

    for (const q of exam.Questions) {
      const studentAnswer = answers[q.id];
      let isCorrect = false;
      let marksAwarded = 0;

      // Merge auto-saved answers with submitted answers (submitted takes precedence)
      const existingSaved = await AttemptAnswer.findOne({ where: { attempt_id: attemptId, question_id: q.id } });
      const finalAnswer = studentAnswer !== undefined ? studentAnswer : (existingSaved?.selected_answer || null);

      if (finalAnswer && Array.isArray(finalAnswer) && finalAnswer.length > 0) {
        if (q.type === 'word' || q.type === 'fill_blank') {
          const studentWord = String(finalAnswer[0] || '').toLowerCase().trim();
          const correctWord = String(q.correct_answer[0] || '').toLowerCase().trim();
          isCorrect = studentWord === correctWord;
        } else {
          const sortedStudent = [...finalAnswer].sort();
          const sortedCorrect = [...(q.correct_answer || [])].sort();
          isCorrect = JSON.stringify(sortedStudent) === JSON.stringify(sortedCorrect);
        }

        if (isCorrect) {
          marksAwarded = q.marks;
        } else if (exam.negative_marking_enabled && finalAnswer.length > 0) {
          marksAwarded = -(exam.negative_marks_per_wrong || 0);
        }
        totalScore += marksAwarded;
      }

      answerRecords.push({
        attempt_id: attemptId,
        question_id: q.id,
        selected_answer: finalAnswer || [],
        is_correct: isCorrect,
        marks_awarded: marksAwarded
      });
    }

    // Clamp score to 0 minimum
    totalScore = Math.max(0, totalScore);
    const percentage = exam.total_marks > 0 ? (totalScore / exam.total_marks) * 100 : 0;
    const isPassed = totalScore >= exam.pass_marks;

    // Upsert answer records
    for (const record of answerRecords) {
      await AttemptAnswer.upsert(record);
    }

    attempt.submitted_at = new Date();
    attempt.status = 'submitted';
    attempt.total_score = totalScore;
    attempt.percentage = parseFloat(percentage.toFixed(2));
    attempt.time_taken_seconds = Math.floor((attempt.submitted_at - attempt.started_at) / 1000);
    await attempt.save();

    return {
      score: totalScore,
      passed: isPassed,
      totalMarks: exam.total_marks,
      percentage: parseFloat(percentage.toFixed(2)),
      timeTakenSeconds: attempt.time_taken_seconds
    };
  }
}

module.exports = EvaluationService;
