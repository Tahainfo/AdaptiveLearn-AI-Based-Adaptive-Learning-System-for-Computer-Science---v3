"""
Diagnostic test routes.

Questions come exclusively from admin-created exercises
(is_diagnostic=1, created_by_admin_id IS NOT NULL).
No hardcoded questions, no AI fallback.
"""
from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from backend.models.database_models import DiagnosticTestRequest, DiagnosticResult
from backend.routes.auth import get_current_student
from backend.database.db import get_db_connection
import json
import random

router = APIRouter(prefix="/diagnostic", tags=["diagnostic"])


@router.get("/concepts")
async def get_concepts(authorization: Optional[str] = Header(None)):
    """Get all available concepts for diagnostic."""
    student_id = get_current_student(authorization)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, name, domain, description
        FROM concepts
        ORDER BY domain, name
    """)
    concepts = cursor.fetchall()
    conn.close()

    return [
        {"id": row[0], "name": row[1], "domain": row[2], "description": row[3]}
        for row in concepts
    ]


@router.get("/questions/{concept_id}")
async def get_diagnostic_questions_for_concept(
    concept_id: int,
    authorization: Optional[str] = Header(None)
):
    """
    Return admin-created diagnostic exercises for a concept.

    Returns [] when no admin diagnostic exercises exist yet —
    the frontend interprets an empty list as "not available".
    """
    student_id = get_current_student(authorization)

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT name FROM concepts WHERE id = ?", (concept_id,))
    concept = cursor.fetchone()
    if not concept:
        conn.close()
        raise HTTPException(status_code=404, detail="Concept not found")

    cursor.execute("""
        SELECT id, title, exercise_prompt, exercise_type, content_json, explanation
        FROM exercises
        WHERE concept_id            = ?
          AND is_diagnostic         = 1
          AND is_active             = 1
          AND created_by_admin_id IS NOT NULL
          AND exercise_type         IN ('mcq', 'true_false', 'short_answer', 'drag_drop', 'match_lines', 'long_answer')
        ORDER BY CASE exercise_type
                     WHEN 'true_false'   THEN 1
                     WHEN 'drag_drop'    THEN 2
                     WHEN 'match_lines'  THEN 3
                     WHEN 'mcq'          THEN 4
                     WHEN 'short_answer' THEN 5
                     WHEN 'long_answer'  THEN 6
                 END,
                 RANDOM()
        LIMIT 10
    """, (concept_id,))

    rows = cursor.fetchall()
    conn.close()

    questions = []
    for ex_id, title, exercise_prompt, exercise_type, content_json_str, explanation in rows:
        content = {}
        if content_json_str:
            try:
                content = json.loads(content_json_str)
            except (json.JSONDecodeError, TypeError):
                pass

        expl = content.get("explanation") or explanation or ""

        if exercise_type == "mcq":
            question_text = content.get("question") or exercise_prompt or title
            options = content.get("options", [])
            correct_option = content.get("correct_option", 0)
            if not options:
                continue
            questions.append({
                "id": ex_id,
                "type": "mcq",
                "question": question_text,
                "input_type": "radio",
                "options": options,
                "correct_index": correct_option,
                "explanation": expl,
            })

        elif exercise_type == "true_false":
            question_text = content.get("statement") or exercise_prompt or title
            correct_option = 0 if content.get("correct_answer", True) else 1
            questions.append({
                "id": ex_id,
                "type": "true_false",
                "question": question_text,
                "input_type": "radio",
                "options": ["True", "False"],
                "correct_index": correct_option,
                "explanation": expl,
            })

        elif exercise_type == "short_answer":
            question_text = content.get("question") or exercise_prompt or title
            correct_answer = content.get("correct_answer", "")
            alternative_answers = content.get("alternative_answers", [])
            questions.append({
                "id": ex_id,
                "type": "short_answer",
                "question": question_text,
                "input_type": "text",
                "correct_answer": correct_answer,
                "alternative_answers": alternative_answers,
                "explanation": expl,
            })

        elif exercise_type == "drag_drop":
            question_text = content.get("question") or exercise_prompt or title
            items = content.get("items", [])
            if not items:
                continue
            correct_items = list(items)
            shuffled = list(items)
            random.shuffle(shuffled)
            questions.append({
                "id": ex_id,
                "type": "drag_drop",
                "question": question_text,
                "input_type": "drag_drop",
                "items": shuffled,
                "correct_items": correct_items,
                "explanation": expl,
            })

        elif exercise_type == "match_lines":
            question_text = content.get("question") or exercise_prompt or title
            pairs = content.get("pairs", [])
            if not pairs:
                continue
            left_items = [p[0] for p in pairs]
            right_items = [p[1] for p in pairs]
            shuffled_rights = list(right_items)
            random.shuffle(shuffled_rights)
            correct_pairs = [shuffled_rights.index(right_items[i]) for i in range(len(pairs))]
            questions.append({
                "id": ex_id,
                "type": "match_lines",
                "question": question_text,
                "input_type": "match_lines",
                "left_items": left_items,
                "right_items": shuffled_rights,
                "correct_pairs": correct_pairs,
                "explanation": expl,
            })

        elif exercise_type == "long_answer":
            question_text = content.get("question") or exercise_prompt or title
            correct_answer = content.get("correct_answer", "")
            keywords = content.get("keywords", [])
            questions.append({
                "id": ex_id,
                "type": "long_answer",
                "question": question_text,
                "input_type": "long_answer",
                "correct_answer": correct_answer,
                "keywords": keywords,
                "explanation": expl,
            })

    return questions


@router.post("/submit/{concept_id}", response_model=DiagnosticResult)
async def submit_diagnostic(
    concept_id: int,
    test_data: DiagnosticTestRequest,
    authorization: Optional[str] = Header(None)
):
    """Submit diagnostic answers for a single concept."""
    student_id = get_current_student(authorization)

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT name FROM concepts WHERE id = ?", (concept_id,))
    concept = cursor.fetchone()
    if not concept:
        conn.close()
        raise HTTPException(status_code=404, detail="Concept not found")

    concept_name = concept[0]

    if not test_data.answers:
        conn.close()
        raise HTTPException(status_code=400, detail="No answers provided")

    correct_count = 0
    total_count = len(test_data.answers)
    question_results = []  # (exercise_id, is_correct)

    for answer in test_data.answers:
        cursor.execute("""
            SELECT exercise_type, content_json FROM exercises
            WHERE id                   = ?
              AND concept_id           = ?
              AND is_diagnostic        = 1
              AND created_by_admin_id IS NOT NULL
        """, (answer.question_id, concept_id))

        row = cursor.fetchone()
        if not row or not row[1]:
            continue

        try:
            exercise_type, content_json_str = row
            content = json.loads(content_json_str)
            if exercise_type == "mcq":
                correct = content.get("correct_option", -1) == answer.selected_index
            elif exercise_type == "true_false":
                correct_bool = content.get("correct_answer", True)
                correct_idx = 0 if correct_bool else 1
                correct = correct_idx == answer.selected_index
            elif exercise_type == "short_answer":
                student_text = (answer.text_answer or "").strip().lower()
                expected = content.get("correct_answer", "").strip().lower()
                alternatives = [a.strip().lower() for a in content.get("alternative_answers", [])]
                correct = student_text == expected or student_text in alternatives
            elif exercise_type == "drag_drop":
                correct_items = content.get("items", [])
                try:
                    student_items = json.loads(answer.text_answer or "[]")
                    correct = student_items == correct_items
                except (json.JSONDecodeError, ValueError):
                    correct = False
            elif exercise_type == "match_lines":
                pairs = content.get("pairs", [])
                correct_rights = [p[1] for p in pairs]
                try:
                    student_rights = json.loads(answer.text_answer or "[]")
                    correct = student_rights == correct_rights
                except (json.JSONDecodeError, ValueError):
                    correct = False
            elif exercise_type == "long_answer":
                student_text = (answer.text_answer or "").strip().lower()
                correct_answer = content.get("correct_answer", "").strip().lower()
                keywords = [k.strip().lower() for k in content.get("keywords", []) if k.strip()]
                if keywords:
                    matched = sum(1 for kw in keywords if kw in student_text)
                    correct = matched >= max(1, len(keywords) * 0.5)
                else:
                    words = [w for w in correct_answer.split() if len(w) >= 4]
                    if words:
                        matched = sum(1 for w in words if w in student_text)
                        correct = matched >= max(1, len(words) * 0.5)
                    else:
                        correct = bool(student_text) and student_text == correct_answer
            else:
                correct = False
            if correct:
                correct_count += 1
            question_results.append((answer.question_id, 1 if correct else 0))
        except (json.JSONDecodeError, TypeError):
            pass

    score = (correct_count / total_count * 100) if total_count > 0 else 0
    mastery_level = min(1.0, max(0.0, score / 100.0))

    cursor.execute("""
        INSERT INTO diagnostic_attempts (student_id, concept_id, score, answers)
        VALUES (?, ?, ?, ?)
    """, (student_id, concept_id, score,
          json.dumps([a.dict() for a in test_data.answers])))
    attempt_id = cursor.lastrowid
    for ex_id, is_correct in question_results:
        cursor.execute("""
            INSERT INTO diagnostic_question_results (attempt_id, exercise_id, is_correct)
            VALUES (?, ?, ?)
        """, (attempt_id, ex_id, is_correct))

    cursor.execute("""
        INSERT OR REPLACE INTO mastery_state
            (student_id, concept_id, mastery_level, attempts_count, correct_count)
        VALUES (?, ?, ?, 1, ?)
    """, (student_id, concept_id, mastery_level, correct_count))

    conn.commit()
    conn.close()

    return {
        "concept_id": concept_id,
        "concept_name": concept_name,
        "score": score,
        "mastery_level": mastery_level,
    }


@router.get("/results/{concept_id}")
async def get_diagnostic_results(
    concept_id: int,
    authorization: Optional[str] = Header(None)
):
    """Get the most recent diagnostic result for a concept."""
    student_id = get_current_student(authorization)

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT da.score, da.created_at, c.name
        FROM diagnostic_attempts da
        JOIN concepts c ON da.concept_id = c.id
        WHERE da.student_id = ? AND da.concept_id = ?
        ORDER BY da.created_at DESC
        LIMIT 1
    """, (student_id, concept_id))

    result = cursor.fetchone()
    conn.close()

    if not result:
        raise HTTPException(status_code=404, detail="No diagnostic results found")

    return {
        "concept_name": result[2],
        "score": result[0],
        "taken_at": result[1],
        "mastery_level": min(1.0, max(0.0, result[0] / 100.0)),
    }


@router.post("/submit")
async def submit_sequence_diagnostic(
    test_data: DiagnosticTestRequest,
    authorization: Optional[str] = Header(None)
):
    """Submit diagnostic answers for a full sequence (multiple concepts)."""
    student_id = get_current_student(authorization)

    if not test_data.answers:
        raise HTTPException(status_code=400, detail="No answers provided")

    conn = get_db_connection()
    cursor = conn.cursor()

    # Group answers by concept_id
    concept_answers: dict = {}
    for answer in test_data.answers:
        cid = getattr(answer, "concept_id", None)
        if cid:
            concept_answers.setdefault(cid, []).append(answer)

    results = []

    for concept_id, answers in concept_answers.items():
        cursor.execute("SELECT name FROM concepts WHERE id = ?", (concept_id,))
        concept = cursor.fetchone()
        if not concept:
            continue

        concept_name = concept[0]
        correct_count = 0
        total_count = len(answers)
        question_results = []

        for answer in answers:
            cursor.execute("""
                SELECT exercise_type, content_json FROM exercises
                WHERE id                   = ?
                  AND concept_id           = ?
                  AND is_diagnostic        = 1
                  AND created_by_admin_id IS NOT NULL
            """, (answer.question_id, concept_id))

            row = cursor.fetchone()
            if not row or not row[1]:
                continue

            try:
                exercise_type, content_json_str = row
                content = json.loads(content_json_str)
                if exercise_type == "mcq":
                    correct = content.get("correct_option", -1) == answer.selected_index
                elif exercise_type == "true_false":
                    correct_bool = content.get("correct_answer", True)
                    correct_idx = 0 if correct_bool else 1
                    correct = correct_idx == answer.selected_index
                elif exercise_type == "short_answer":
                    student_text = (answer.text_answer or "").strip().lower()
                    expected = content.get("correct_answer", "").strip().lower()
                    alternatives = [a.strip().lower() for a in content.get("alternative_answers", [])]
                    correct = student_text == expected or student_text in alternatives
                elif exercise_type == "drag_drop":
                    correct_items = content.get("items", [])
                    try:
                        student_items = json.loads(answer.text_answer or "[]")
                        correct = student_items == correct_items
                    except (json.JSONDecodeError, ValueError):
                        correct = False
                elif exercise_type == "match_lines":
                    pairs = content.get("pairs", [])
                    correct_rights = [p[1] for p in pairs]
                    try:
                        student_rights = json.loads(answer.text_answer or "[]")
                        correct = student_rights == correct_rights
                    except (json.JSONDecodeError, ValueError):
                        correct = False
                elif exercise_type == "long_answer":
                    student_text = (answer.text_answer or "").strip().lower()
                    correct_answer = content.get("correct_answer", "").strip().lower()
                    keywords = [k.strip().lower() for k in content.get("keywords", []) if k.strip()]
                    if keywords:
                        matched = sum(1 for kw in keywords if kw in student_text)
                        correct = matched >= max(1, len(keywords) * 0.5)
                    else:
                        words = [w for w in correct_answer.split() if len(w) >= 4]
                        if words:
                            matched = sum(1 for w in words if w in student_text)
                            correct = matched >= max(1, len(words) * 0.5)
                        else:
                            correct = bool(student_text) and student_text == correct_answer
                else:
                    correct = False
                if correct:
                    correct_count += 1
                question_results.append((answer.question_id, 1 if correct else 0))
            except (json.JSONDecodeError, TypeError):
                pass

        score = (correct_count / total_count * 100) if total_count > 0 else 0
        mastery_level = min(1.0, max(0.0, score / 100.0))

        cursor.execute("""
            INSERT INTO diagnostic_attempts (student_id, concept_id, score, answers)
            VALUES (?, ?, ?, ?)
        """, (student_id, concept_id, score,
              json.dumps([{"question_id": a.question_id,
                           "selected_index": a.selected_index,
                           "text_answer": getattr(a, "text_answer", None)}
                          for a in answers])))
        seq_attempt_id = cursor.lastrowid
        for ex_id, is_correct in question_results:
            cursor.execute("""
                INSERT INTO diagnostic_question_results (attempt_id, exercise_id, is_correct)
                VALUES (?, ?, ?)
            """, (seq_attempt_id, ex_id, is_correct))

        cursor.execute("""
            INSERT OR REPLACE INTO mastery_state
                (student_id, concept_id, mastery_level, attempts_count, correct_count)
            VALUES (?, ?, ?, 1, ?)
        """, (student_id, concept_id, mastery_level, correct_count))

        results.append({
            "concept_id": concept_id,
            "concept_name": concept_name,
            "score": score,
            "mastery_level": mastery_level,
        })

    conn.commit()
    conn.close()

    return results if results else [{"message": "No valid concept answers found"}]


@router.get("/history/{concept_id}")
async def get_concept_diagnostic_history(
    concept_id: int,
    authorization: Optional[str] = Header(None)
):
    """All past diagnostic attempt scores for one concept, ordered chronologically."""
    student_id = get_current_student(authorization)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT score, created_at
        FROM diagnostic_attempts
        WHERE student_id = ? AND concept_id = ?
        ORDER BY created_at ASC
    """, (student_id, concept_id))
    rows = cursor.fetchall()
    conn.close()

    return [
        {"attempt_num": i + 1, "score": round(float(r[0]), 1), "date": r[1]}
        for i, r in enumerate(rows)
    ]


@router.get("/sequence-history/{sequence_id}")
async def get_sequence_diagnostic_history(
    sequence_id: int,
    authorization: Optional[str] = Header(None)
):
    """Session-level history for a full sequence: per session = mean score across all concepts."""
    student_id = get_current_student(authorization)

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id, name FROM concepts WHERE sequence_id = ? ORDER BY id",
        (sequence_id,)
    )
    concepts = cursor.fetchall()

    if not concepts:
        conn.close()
        return []

    concept_histories: dict = {}
    for cid, cname in concepts:
        cursor.execute("""
            SELECT score, created_at FROM diagnostic_attempts
            WHERE student_id = ? AND concept_id = ?
            ORDER BY created_at ASC
        """, (student_id, cid))
        concept_histories[cname] = [float(r[0]) for r in cursor.fetchall()]

    conn.close()

    max_attempts = max((len(v) for v in concept_histories.values()), default=0)
    if max_attempts == 0:
        return []

    result = []
    for att_num in range(1, max_attempts + 1):
        session_scores = []
        per_concept = []
        for cname, scores in concept_histories.items():
            if len(scores) >= att_num:
                sc = scores[att_num - 1]
                session_scores.append(sc)
                per_concept.append({"concept_name": cname, "score": round(sc, 1)})
        if session_scores:
            overall = round(sum(session_scores) / len(session_scores), 1)
            result.append({
                "attempt_num": att_num,
                "overall": overall,
                "per_concept": per_concept
            })

    return result
