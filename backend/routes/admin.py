"""
Admin Interface Routes - Complete CRUD for Users, Exercises, Analytics
Requires admin role for access
"""
from fastapi import APIRouter, HTTPException, Header, Depends
from typing import Optional, List
import json
import math
import statistics as stats_lib
from datetime import datetime

from backend.models.admin_models import (
    AdminStudentCreate, AdminStudentUpdate, AdminPasswordReset, AdminStudentResponse,
    AdminExerciseCreate, AdminExerciseUpdate, AdminExerciseResponse,
    AdminLogResponse, AdminAnalyticsResponse, AdminDashboardResponse,
    ExerciseTemplateCreate, ExerciseTemplateResponse
)
from backend.utils.rbac import (
    require_admin, log_admin_action, verify_user_exists,
    verify_concept_exists, verify_sequence_exists, verify_module_exists,
    get_admin_username, get_student_mastery_stats, get_exercise_stats
)
from backend.utils.auth import hash_password
from backend.database.db import get_db_connection
from backend.routes.auth import get_current_student

router = APIRouter(prefix="/admin", tags=["admin"])

# =============================================================================
# STUDENT MANAGEMENT ENDPOINTS
# =============================================================================

@router.post("/students")
async def create_student(
    student_data: AdminStudentCreate,
    admin_id: int = Depends(require_admin)
):
    """Create a new student account (admin only)"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if username/email already exists
    cursor.execute("SELECT id FROM students WHERE username = %s OR email = %s", 
                  (student_data.username, student_data.email))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    # Hash password
    password_hash = hash_password(student_data.password)
    
    try:
        cursor.execute("""
            INSERT INTO students (username, email, password_hash, role, is_active, classe)
            VALUES (%s, %s, %s, %s, 1, %s)
            RETURNING id
        """, (student_data.username, student_data.email, password_hash, student_data.role.value, student_data.classe))
        new_student_id = cursor.fetchone()[0]
        conn.commit()
        
        # Initialize mastery for this student
        cursor.execute("SELECT id FROM concepts")
        concepts = cursor.fetchall()
        for concept in concepts:
            cursor.execute("""
                INSERT INTO mastery_state 
                (student_id, concept_id, mastery_level, attempts_count, correct_count)
                VALUES (%s, %s, 0.0, 0, 0)
            """, (new_student_id, concept[0]))
        conn.commit()
        
        # Log action
        log_admin_action(
            admin_id=admin_id,
            action_type="create_student",
            entity="student",
            entity_id=new_student_id,
            target_user_id=new_student_id,
            details={"username": student_data.username, "role": student_data.role.value}
        )
        
        return {
            "id": new_student_id,
            "username": student_data.username,
            "email": student_data.email,
            "role": student_data.role.value,
            "message": "Student created successfully"
        }
    
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.get("/students/{student_id}")
async def get_student_details(
    student_id: int,
    admin_id: int = Depends(require_admin)
) -> AdminStudentResponse:
    """Get detailed view of a student"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, username, email, role, is_active, created_at, classe
        FROM students WHERE id = %s
    """, (student_id,))

    student = cursor.fetchone()
    if not student:
        conn.close()
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get exercise stats
    cursor.execute("""
        SELECT COUNT(*) as exercises_completed
        FROM exercise_attempts WHERE student_id = %s
    """, (student_id,))
    exercises_completed = cursor.fetchone()[0]
    
    conn.close()
    
    # Get mastery stats
    mastery_stats = get_student_mastery_stats(student_id)
    
    # Log action
    log_admin_action(
        admin_id=admin_id,
        action_type="view_student_progress",
        entity="student",
        entity_id=student_id,
        target_user_id=student_id
    )
    
    return AdminStudentResponse(
        id=student[0],
        username=student[1],
        email=student[2],
        role=student[3],
        is_active=bool(student[4]),
        created_at=student[5],
        classe=student[6],
        total_exercises_completed=exercises_completed,
        average_mastery=mastery_stats.get("average_mastery", 0.0)
    )

@router.get("/students")
async def list_students(
    skip: int = 0,
    limit: int = 50,
    admin_id: int = Depends(require_admin)
):
    """List all students with pagination"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, username, email, role, is_active, created_at, classe
        FROM students
        ORDER BY created_at DESC
        LIMIT %s OFFSET %s
    """, (limit, skip))

    students = cursor.fetchall()

    cursor.execute("SELECT COUNT(*) FROM students")
    total = cursor.fetchone()[0]

    conn.close()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "students": [
            {
                "id": s[0],
                "username": s[1],
                "email": s[2],
                "role": s[3],
                "is_active": bool(s[4]),
                "created_at": s[5],
                "classe": s[6]
            }
            for s in students
        ]
    }

@router.put("/students/{student_id}")
async def update_student(
    student_id: int,
    update_data: AdminStudentUpdate,
    admin_id: int = Depends(require_admin)
):
    """Update student information"""
    if not verify_user_exists(student_id):
        raise HTTPException(status_code=404, detail="Student not found")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Build dynamic update query
    updates = []
    params = []
    
    if update_data.email is not None:
        updates.append("email = %s")
        params.append(update_data.email)
    if update_data.username is not None:
        updates.append("username = %s")
        params.append(update_data.username)
    if update_data.is_active is not None:
        updates.append("is_active = %s")
        params.append(1 if update_data.is_active else 0)
    if update_data.role is not None:
        updates.append("role = %s")
        params.append(update_data.role.value)
    if update_data.classe is not None:
        updates.append("classe = %s")
        params.append(update_data.classe)

    if not updates:
        conn.close()
        return {"message": "No updates provided"}
    
    params.append(student_id)
    
    try:
        query = f"UPDATE students SET {', '.join(updates)} WHERE id = %s"
        cursor.execute(query, params)
        conn.commit()
        
        log_admin_action(
            admin_id=admin_id,
            action_type="update_student",
            entity="student",
            entity_id=student_id,
            target_user_id=student_id,
            details=update_data.dict(exclude_unset=True)
        )
        
        return {"message": "Student updated successfully"}
    
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.post("/students/{student_id}/reset-password")
async def reset_password(
    student_id: int,
    password_data: AdminPasswordReset,
    admin_id: int = Depends(require_admin)
):
    """Admin reset student password"""
    if not verify_user_exists(student_id):
        raise HTTPException(status_code=404, detail="Student not found")
    
    if password_data.new_password != password_data.new_password_confirm:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    
    if len(password_data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    password_hash = hash_password(password_data.new_password)
    
    try:
        cursor.execute(
            "UPDATE students SET password_hash = %s WHERE id = %s",
            (password_hash, student_id)
        )
        conn.commit()
        
        log_admin_action(
            admin_id=admin_id,
            action_type="reset_password",
            entity="student",
            entity_id=student_id,
            target_user_id=student_id
        )
        
        return {"message": "Password reset successfully"}
    
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.delete("/students/{student_id}")
async def delete_student(
    student_id: int,
    admin_id: int = Depends(require_admin)
):
    """Permanently delete a student and all their associated data."""
    if not verify_user_exists(student_id):
        raise HTTPException(status_code=404, detail="Student not found")

    if student_id == admin_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Log the action BEFORE deletion so the record still exists for FK integrity
        log_admin_action(
            admin_id=admin_id,
            action_type="delete_student",
            entity="student",
            entity_id=student_id,
            target_user_id=student_id
        )

        # 1. Delete diagnostic question results (child of diagnostic_attempts)
        cursor.execute("""
            DELETE FROM diagnostic_question_results
            WHERE attempt_id IN (
                SELECT id FROM diagnostic_attempts WHERE student_id = %s
            )
        """, (student_id,))

        # 2. Delete activity data directly linked to the student
        cursor.execute("DELETE FROM diagnostic_attempts WHERE student_id = %s", (student_id,))
        cursor.execute("DELETE FROM exercise_attempts   WHERE student_id = %s", (student_id,))
        cursor.execute("DELETE FROM mistakes_log        WHERE student_id = %s", (student_id,))
        cursor.execute("DELETE FROM mastery_state       WHERE student_id = %s", (student_id,))

        # 3. Nullify FK references in tables that must be preserved
        cursor.execute("UPDATE exercises          SET created_by_admin_id = NULL WHERE created_by_admin_id = %s", (student_id,))
        cursor.execute("UPDATE exercise_templates SET created_by_admin_id = NULL WHERE created_by_admin_id = %s", (student_id,))
        cursor.execute("UPDATE admin_settings     SET updated_by_admin_id = NULL WHERE updated_by_admin_id = %s", (student_id,))
        cursor.execute("UPDATE admin_logs         SET target_user_id      = NULL WHERE target_user_id      = %s", (student_id,))

        # 4. Delete the student record itself
        cursor.execute("DELETE FROM students WHERE id = %s", (student_id,))

        conn.commit()
        return {"message": "Student permanently deleted"}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# =============================================================================
# CURRICULUM ENDPOINTS (admin view — no mastery data)
# =============================================================================

@router.get("/concepts")
async def get_all_concepts_for_admin(
    admin_id: int = Depends(require_admin)
):
    """
    Return all concepts with their sequence and module context.
    Used by the admin exercise creation form.
    No mastery data — admin-only, lightweight.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            c.id          AS concept_id,
            c.name        AS concept_name,
            c.domain      AS concept_domain,
            s.id          AS sequence_id,
            s.title       AS sequence_title,
            m.id          AS module_id,
            m.title       AS module_title
        FROM concepts c
        JOIN sequences s ON s.id = c.sequence_id
        JOIN modules   m ON m.id = s.module_id
        ORDER BY m.order_index, s.order_index, c.id
    """)

    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "id":             row[0],
            "name":           row[1],
            "domain":         row[2],
            "sequence_id":    row[3],
            "sequence_title": row[4],
            "module_id":      row[5],
            "module_title":   row[6],
        }
        for row in rows
    ]


# =============================================================================
# EXERCISE MANAGEMENT ENDPOINTS
# =============================================================================

@router.post("/exercises")
async def create_exercise(
    exercise_data: AdminExerciseCreate,
    admin_id: int = Depends(require_admin)
):
    """Create a new exercise"""
    # Validate foreign keys
    if not verify_module_exists(exercise_data.module_id):
        raise HTTPException(status_code=404, detail="Module not found")
    if not verify_sequence_exists(exercise_data.sequence_id):
        raise HTTPException(status_code=404, detail="Sequence not found")
    if not verify_concept_exists(exercise_data.concept_id):
        raise HTTPException(status_code=404, detail="Concept not found")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO exercises 
            (title, description, concept_id, difficulty, exercise_type, 
             is_diagnostic, error_type_targeted, content_json, explanation, 
             created_by_admin_id, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            exercise_data.title,
            exercise_data.description,
            exercise_data.concept_id,
            exercise_data.difficulty,
            exercise_data.exercise_type.value,
            1 if exercise_data.is_diagnostic else 0,
            exercise_data.error_type_targeted.value if exercise_data.error_type_targeted else None,
            json.dumps(exercise_data.content_json),
            exercise_data.explanation,
            admin_id,
            1 if exercise_data.is_active else 0
        ))
        exercise_id = cursor.fetchone()[0]
        conn.commit()
        
        log_admin_action(
            admin_id=admin_id,
            action_type="create_exercise",
            entity="exercise",
            entity_id=exercise_id,
            details={
                "title": exercise_data.title,
                "type": exercise_data.exercise_type.value,
                "concept_id": exercise_data.concept_id
            }
        )
        
        return {
            "id": exercise_id,
            "message": "Exercise created successfully"
        }
    
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.get("/exercises/{exercise_id}")
async def get_exercise(
    exercise_id: int,
    admin_id: int = Depends(require_admin)
) -> AdminExerciseResponse:
    """Get exercise details"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT e.id, e.title, e.description, e.concept_id, e.difficulty,
               e.exercise_type, e.is_diagnostic, e.error_type_targeted,
               e.content_json, e.explanation, e.created_by_admin_id,
               e.is_active, e.created_at,
               s.id AS sequence_id, m.id AS module_id
        FROM exercises e
        LEFT JOIN concepts c  ON c.id = e.concept_id
        LEFT JOIN sequences s ON s.id = c.sequence_id
        LEFT JOIN modules   m ON m.id = s.module_id
        WHERE e.id = %s
    """, (exercise_id,))

    exercise = cursor.fetchone()
    conn.close()

    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    stats = get_exercise_stats(exercise_id)

    content = None
    if exercise[8]:
        try:
            content = json.loads(exercise[8])
        except (json.JSONDecodeError, TypeError):
            pass

    return AdminExerciseResponse(
        id=exercise[0],
        title=exercise[1],
        description=exercise[2],
        module_id=exercise[14] or 0,
        sequence_id=exercise[13] or 0,
        concept_id=exercise[3],
        difficulty=exercise[4],
        exercise_type=exercise[5],
        is_diagnostic=bool(exercise[6]),
        error_type_targeted=exercise[7],
        content_json=content,
        is_active=bool(exercise[11]),
        created_by_admin_id=exercise[10],
        created_at=exercise[12],
        attempt_count=stats["total_attempts"],
        success_rate=stats["success_rate"]
    )

@router.get("/exercises")
async def list_exercises(
    concept_id: Optional[int] = None,
    exercise_type: Optional[str] = None,
    is_diagnostic: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50,
    admin_id: int = Depends(require_admin)
):
    """List exercises with filters"""
    conn = get_db_connection()
    cursor = conn.cursor()

    base = """
        SELECT e.id, e.title, e.exercise_type, e.difficulty,
               e.is_diagnostic, e.is_active, e.created_by_admin_id,
               e.error_type_targeted, c.name AS concept_name
        FROM exercises e
        LEFT JOIN concepts c ON c.id = e.concept_id
        WHERE 1=1
    """
    params = []

    if concept_id:
        base += " AND e.concept_id = %s"
        params.append(concept_id)
    if exercise_type:
        base += " AND e.exercise_type = %s"
        params.append(exercise_type)
    if is_diagnostic is not None:
        base += " AND e.is_diagnostic = %s"
        params.append(1 if is_diagnostic else 0)

    base += " ORDER BY e.created_at DESC LIMIT %s OFFSET %s"
    params.extend([limit, skip])

    cursor.execute(base, params)
    exercises = cursor.fetchall()

    count_query = "SELECT COUNT(*) FROM exercises WHERE 1=1"
    count_params = []
    if concept_id:
        count_query += " AND concept_id = %s"
        count_params.append(concept_id)
    if exercise_type:
        count_query += " AND exercise_type = %s"
        count_params.append(exercise_type)
    if is_diagnostic is not None:
        count_query += " AND is_diagnostic = %s"
        count_params.append(1 if is_diagnostic else 0)

    cursor.execute(count_query, count_params)
    total = cursor.fetchone()[0]
    conn.close()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "exercises": [
            {
                "id": e[0],
                "title": e[1],
                "exercise_type": e[2],
                "difficulty": e[3],
                "is_diagnostic": bool(e[4]),
                "is_active": bool(e[5]),
                "created_by_admin_id": e[6],
                "error_type_targeted": e[7],
                "concept_name": e[8] or "—",
            }
            for e in exercises
        ]
    }

@router.put("/exercises/{exercise_id}")
async def update_exercise(
    exercise_id: int,
    update_data: AdminExerciseUpdate,
    admin_id: int = Depends(require_admin)
):
    """Update exercise"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM exercises WHERE id = %s", (exercise_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Exercise not found")
    
    updates = []
    params = []
    
    if update_data.title is not None:
        updates.append("title = %s")
        params.append(update_data.title)
    if update_data.description is not None:
        updates.append("description = %s")
        params.append(update_data.description)
    if update_data.difficulty is not None:
        updates.append("difficulty = %s")
        params.append(update_data.difficulty)
    if update_data.exercise_type is not None:
        updates.append("exercise_type = %s")
        params.append(update_data.exercise_type.value)
    if update_data.is_diagnostic is not None:
        updates.append("is_diagnostic = %s")
        params.append(1 if update_data.is_diagnostic else 0)
    if update_data.error_type_targeted is not None:
        updates.append("error_type_targeted = %s")
        params.append(update_data.error_type_targeted.value)
    if update_data.content_json is not None:
        updates.append("content_json = %s")
        params.append(json.dumps(update_data.content_json))
    if update_data.explanation is not None:
        updates.append("explanation = %s")
        params.append(update_data.explanation)
    if update_data.is_active is not None:
        updates.append("is_active = %s")
        params.append(1 if update_data.is_active else 0)
    
    if not updates:
        conn.close()
        return {"message": "No updates provided"}
    
    params.append(exercise_id)
    
    try:
        query = f"UPDATE exercises SET {', '.join(updates)} WHERE id = %s"
        cursor.execute(query, params)
        conn.commit()
        
        log_admin_action(
            admin_id=admin_id,
            action_type="update_exercise",
            entity="exercise",
            entity_id=exercise_id
        )
        
        return {"message": "Exercise updated successfully"}
    
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.post("/exercises/{exercise_id}/activate")
async def activate_exercise(
    exercise_id: int,
    admin_id: int = Depends(require_admin)
):
    """Activate an exercise"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("UPDATE exercises SET is_active = 1 WHERE id = %s", (exercise_id,))
    conn.commit()
    conn.close()
    
    log_admin_action(
        admin_id=admin_id,
        action_type="activate_exercise",
        entity="exercise",
        entity_id=exercise_id
    )
    
    return {"message": "Exercise activated"}

@router.post("/exercises/{exercise_id}/deactivate")
async def deactivate_exercise(
    exercise_id: int,
    admin_id: int = Depends(require_admin)
):
    """Deactivate an exercise"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("UPDATE exercises SET is_active = 0 WHERE id = %s", (exercise_id,))
    conn.commit()
    conn.close()

    log_admin_action(
        admin_id=admin_id,
        action_type="deactivate_exercise",
        entity="exercise",
        entity_id=exercise_id
    )

    return {"message": "Exercise deactivated"}


@router.delete("/exercises/{exercise_id}")
async def delete_exercise(
    exercise_id: int,
    admin_id: int = Depends(require_admin)
):
    """Permanently delete an exercise and all related attempt records."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id, title FROM exercises WHERE id = %s", (exercise_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Exercise not found")

    title = row[1]

    try:
        cursor.execute("DELETE FROM exercise_attempts WHERE exercise_id = %s", (exercise_id,))
        cursor.execute("DELETE FROM exercises WHERE id = %s", (exercise_id,))
        conn.commit()

        log_admin_action(
            admin_id=admin_id,
            action_type="delete_exercise",
            entity="exercise",
            entity_id=exercise_id,
            details={"title": title}
        )

        return {"message": "Exercise deleted successfully"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


# =============================================================================
# ADMIN LOGS & ANALYTICS
# =============================================================================

@router.get("/logs")
async def get_admin_logs(
    skip: int = 0,
    limit: int = 50,
    admin_id: int = Depends(require_admin)
):
    """Get admin action logs"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT l.id, l.admin_id, s.username, l.action_type, l.entity, 
               l.entity_id, l.target_user_id, l.details, l.timestamp
        FROM admin_logs l
        JOIN students s ON l.admin_id = s.id
        ORDER BY l.timestamp DESC
        LIMIT %s OFFSET %s
    """, (limit, skip))
    
    logs = cursor.fetchall()
    
    cursor.execute("SELECT COUNT(*) FROM admin_logs")
    total = cursor.fetchone()[0]
    
    conn.close()
    
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "logs": [
            {
                "id": l[0],
                "admin_id": l[1],
                "admin_username": l[2],
                "action_type": l[3],
                "entity": l[4],
                "entity_id": l[5],
                "target_user_id": l[6],
                "details": json.loads(l[7]) if l[7] else None,
                "timestamp": l[8]
            }
            for l in logs
        ]
    }

@router.get("/analytics")
async def get_analytics(
    admin_id: int = Depends(require_admin)
) -> AdminAnalyticsResponse:
    """Get system-wide analytics"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Total students
    cursor.execute("SELECT COUNT(*) FROM students WHERE role = 'student' AND is_active = 1")
    total_students = cursor.fetchone()[0]
    
    # Total exercises
    cursor.execute("SELECT COUNT(*) FROM exercises WHERE is_active = 1")
    total_exercises = cursor.fetchone()[0]
    
    # Admin-created exercises
    cursor.execute("SELECT COUNT(*) FROM exercises WHERE created_by_admin_id IS NOT NULL AND is_active = 1")
    admin_exercises = cursor.fetchone()[0]
    
    ai_exercises = total_exercises - admin_exercises
    
    # Average mastery
    cursor.execute("SELECT AVG(mastery_level) FROM mastery_state")
    avg_mastery = cursor.fetchone()[0] or 0.0
    
    # Weakest concepts
    cursor.execute("""
        SELECT c.id, c.name, AVG(m.mastery_level) as avg_mastery,
               COUNT(DISTINCT m.student_id) as weak_student_count
        FROM concepts c
        LEFT JOIN mastery_state m ON c.id = m.concept_id
        WHERE m.mastery_level < 0.5
        GROUP BY c.id, c.name
        ORDER BY avg_mastery ASC
        LIMIT 5
    """)
    
    weakest = []
    for row in cursor.fetchall():
        weakest.append({
            "concept_id": row[0],
            "concept_name": row[1],
            "average_mastery": round(row[2], 2) if row[2] else 0,
            "students_with_weakness": row[3],
            "students_with_strength": 0,
            "total_attempts": 0,
            "success_rate": 0
        })
    
    # Most common errors
    cursor.execute("""
        SELECT error_type, COUNT(*) as frequency
        FROM exercise_attempts
        WHERE error_type IS NOT NULL
        GROUP BY error_type
        ORDER BY frequency DESC
    """)
    
    errors = []
    for row in cursor.fetchall():
        errors.append({
            "error_type": row[0],
            "frequency": row[1],
            "student_count": 0,
            "concepts_affected": [],
            "avg_difficulty": 0
        })
    
    # Diagnostic completion
    cursor.execute("""
        SELECT COUNT(DISTINCT student_id) FROM diagnostic_attempts
    """)
    diagnostic_completions = cursor.fetchone()[0]
    diagnostic_rate = (diagnostic_completions / total_students * 100) if total_students > 0 else 0
    
    conn.close()
    
    return AdminAnalyticsResponse(
        total_students=total_students,
        total_exercises=total_exercises,
        admin_created_exercises=admin_exercises,
        ai_generated_exercises=ai_exercises,
        average_student_mastery=round(avg_mastery, 2),
        weakest_concepts=weakest,
        most_common_errors=errors,
        diagnostic_completion_rate=round(diagnostic_rate, 2),
        timestamp=datetime.now().isoformat()
    )

@router.get("/dashboard")
async def get_admin_dashboard(
    admin_id: int = Depends(require_admin)
) -> AdminDashboardResponse:
    """Get admin dashboard summary"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get stats
    cursor.execute("SELECT COUNT(*) FROM students WHERE role = 'student'")
    total_students = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM students WHERE role = 'student' AND is_active = 1")
    active_students = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM exercises WHERE is_active = 1")
    total_exercises = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM exercises WHERE created_by_admin_id IS NOT NULL AND is_active = 1")
    admin_exercises = cursor.fetchone()[0]
    
    # Recent logs
    cursor.execute("""
        SELECT l.id, l.admin_id, s.username, l.action_type, l.entity, 
               l.entity_id, l.target_user_id, l.details, l.timestamp
        FROM admin_logs l
        JOIN students s ON l.admin_id = s.id
        ORDER BY l.timestamp DESC
        LIMIT 10
    """)
    
    recent_logs = []
    for row in cursor.fetchall():
        recent_logs.append(AdminLogResponse(
            id=row[0],
            admin_id=row[1],
            admin_username=row[2],
            action_type=row[3],
            entity=row[4],
            entity_id=row[5],
            target_user_id=row[6],
            details=json.loads(row[7]) if row[7] else None,
            timestamp=row[8]
        ))
    
    # Mastery distribution
    cursor.execute("""
        SELECT
            SUM(CASE WHEN avg_mastery >= 0.7 THEN 1 ELSE 0 END) as excellent,
            SUM(CASE WHEN avg_mastery >= 0.4 AND avg_mastery < 0.7 THEN 1 ELSE 0 END) as good,
            SUM(CASE WHEN avg_mastery < 0.4 THEN 1 ELSE 0 END) as weak
        FROM (
            SELECT ms.student_id, AVG(ms.mastery_level) as avg_mastery
            FROM mastery_state ms
            JOIN students s ON ms.student_id = s.id
            WHERE s.role = 'student'
            GROUP BY ms.student_id
        )
    """)
    
    mastery_dist = cursor.fetchone()
    distribution = {
        "excellent": mastery_dist[0] or 0,
        "good": mastery_dist[1] or 0,
        "weak": mastery_dist[2] or 0
    }
    
    # Most practiced concepts
    cursor.execute("""
        SELECT c.name, COUNT(*) as attempt_count
        FROM exercise_attempts ea
        JOIN exercises e ON ea.exercise_id = e.id
        JOIN concepts c ON e.concept_id = c.id
        GROUP BY c.id, c.name
        ORDER BY attempt_count DESC
        LIMIT 5
    """)
    
    most_practiced = [
        {"concept_name": row[0], "attempts": row[1]}
        for row in cursor.fetchall()
    ]
    
    conn.close()
    
    return AdminDashboardResponse(
        total_students=total_students,
        active_students=active_students,
        total_exercises=total_exercises,
        admin_exercises_count=admin_exercises,
        recent_logs=recent_logs,
        student_mastery_distribution=distribution,
        most_practiced_concepts=most_practiced,
        timestamp=datetime.now().isoformat()
    )


# =============================================================================
# ADVANCED ANALYTICS ENDPOINTS
# =============================================================================

@router.get("/analytics/concepts-with-diagnostics")
async def get_concepts_with_diagnostics(admin_id: int = Depends(require_admin)):
    """Return concepts that have at least one admin diagnostic exercise."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT DISTINCT c.id, c.name, s.title AS seq_title, m.title AS mod_title
        FROM concepts c
        JOIN exercises e ON e.concept_id = c.id
        LEFT JOIN sequences s ON c.sequence_id = s.id
        LEFT JOIN modules m ON s.module_id = m.id
        WHERE e.is_diagnostic = 1 AND e.created_by_admin_id IS NOT NULL AND e.is_active = 1
        ORDER BY m.order_index, s.order_index, c.name
    """)
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "name": r[1], "sequence": r[2] or "", "module": r[3] or ""} for r in rows]


@router.get("/classes")
async def get_classes(admin_id: int = Depends(require_admin)):
    """Return the distinct non-null classe values present in student accounts."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT DISTINCT classe FROM students
        WHERE role = 'student' AND classe IS NOT NULL AND classe != ''
        ORDER BY classe
    """)
    rows = cursor.fetchall()
    conn.close()
    return [r[0] for r in rows]


@router.get("/analytics/sequences-with-diagnostics")
async def get_sequences_with_diagnostics(admin_id: int = Depends(require_admin)):
    """Return sequences (tests) that have at least one concept with diagnostic exercises."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT DISTINCT s.id, s.title, m.title AS mod_title
        FROM sequences s
        JOIN concepts c ON c.sequence_id = s.id
        JOIN exercises e ON e.concept_id = c.id
        LEFT JOIN modules m ON s.module_id = m.id
        WHERE e.is_diagnostic = 1 AND e.created_by_admin_id IS NOT NULL AND e.is_active = 1
        ORDER BY m.order_index, s.order_index, s.title
    """)
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "name": r[1], "module": r[2] or ""} for r in rows]


@router.get("/analytics/diagnostic-sequence")
async def get_diagnostic_sequence_stats(
    sequence_id: int,
    classe: Optional[str] = None,
    admin_id: int = Depends(require_admin)
):
    """Per-concept statistics for all concepts in a sequence's diagnostic tests."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT title FROM sequences WHERE id = %s", (sequence_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Sequence not found")
    sequence_name = row[0]

    cursor.execute("""
        SELECT DISTINCT c.id, c.name
        FROM concepts c
        JOIN exercises e ON e.concept_id = c.id
        WHERE c.sequence_id = %s AND e.is_diagnostic = 1
              AND e.created_by_admin_id IS NOT NULL AND e.is_active = 1
        ORDER BY c.id
    """, (sequence_id,))
    concepts = cursor.fetchall()

    results = []
    global_student_ids: set = set()
    # {student_id: {attempt_num: [concept_scores]}} — aggregate per student/attempt across concepts
    global_per_student_per_attempt: dict = {}

    for concept_id, concept_name in concepts:
        if classe:
            cursor.execute("""
                SELECT da.id, da.student_id, da.score, da.created_at
                FROM diagnostic_attempts da
                JOIN students s ON da.student_id = s.id
                WHERE da.concept_id = %s AND s.role = 'student' AND s.classe = %s
                ORDER BY da.student_id, da.created_at
            """, (concept_id, classe))
        else:
            cursor.execute("""
                SELECT da.id, da.student_id, da.score, da.created_at
                FROM diagnostic_attempts da
                JOIN students s ON da.student_id = s.id
                WHERE da.concept_id = %s AND s.role = 'student'
                ORDER BY da.student_id, da.created_at
            """, (concept_id,))
        rows = cursor.fetchall()

        if not rows:
            results.append({
                "concept_id": concept_id, "concept_name": concept_name,
                "total_attempts": 0, "unique_students": 0,
                "score_stats": None, "distribution": {},
                "pass_rate_50": 0, "pass_rate_70": 0,
                "hardest_questions": [], "progression": {},
                "attempt_stats": [], "min_avg_attempt": None, "max_avg_attempt": None
            })
            continue

        scores = [float(r[2]) for r in rows]
        student_ids = [r[1] for r in rows]
        unique_students = len(set(student_ids))
        global_student_ids.update(student_ids)

        mean_s   = stats_lib.mean(scores)
        std_s    = stats_lib.stdev(scores) if len(scores) > 1 else 0.0
        min_s    = min(scores)
        max_s    = max(scores)
        median_s = stats_lib.median(scores)
        sorted_s = sorted(scores)
        n = len(sorted_s)
        q1 = stats_lib.median(sorted_s[:n // 2]) if n >= 2 else sorted_s[0]
        q3 = stats_lib.median(sorted_s[(n + 1) // 2:]) if n >= 2 else sorted_s[-1]

        dist = {"0-20": 0, "20-40": 0, "40-60": 0, "60-80": 0, "80-100": 0}
        for sc in scores:
            if sc < 20:   dist["0-20"]   += 1
            elif sc < 40: dist["20-40"]  += 1
            elif sc < 60: dist["40-60"]  += 1
            elif sc < 80: dist["60-80"]  += 1
            else:         dist["80-100"] += 1

        pass_50 = round(sum(1 for sc in scores if sc >= 50) / len(scores) * 100, 1)
        pass_70 = round(sum(1 for sc in scores if sc >= 70) / len(scores) * 100, 1)

        # Per-attempt-number stats (rows are ordered by student_id, created_at)
        student_scores_ordered: dict = {}
        for r in rows:
            sid, score = r[1], float(r[2])
            student_scores_ordered.setdefault(sid, []).append(score)

        # Accumulate per-student per-concept scores, grouped by attempt number
        for sid, att_list in student_scores_ordered.items():
            if sid not in global_per_student_per_attempt:
                global_per_student_per_attempt[sid] = {}
            for att_num, sc in enumerate(att_list, 1):
                global_per_student_per_attempt[sid].setdefault(att_num, []).append(sc)

        max_att = max((len(v) for v in student_scores_ordered.values()), default=0)
        attempt_stats = []
        for att_num in range(1, max_att + 1):
            att_scores = [v[att_num - 1] for v in student_scores_ordered.values() if len(v) >= att_num]
            if not att_scores:
                continue
            att_dist: dict = {"0-20": 0, "20-40": 0, "40-60": 0, "60-80": 0, "80-100": 0}
            for sc in att_scores:
                if sc < 20:   att_dist["0-20"]   += 1
                elif sc < 40: att_dist["20-40"]  += 1
                elif sc < 60: att_dist["40-60"]  += 1
                elif sc < 80: att_dist["60-80"]  += 1
                else:         att_dist["80-100"] += 1
            att_sorted = sorted(att_scores)
            att_n = len(att_sorted)
            att_q1 = round(stats_lib.median(att_sorted[:att_n // 2]), 1) if att_n >= 2 else att_sorted[0]
            att_q3 = round(stats_lib.median(att_sorted[(att_n + 1) // 2:]), 1) if att_n >= 2 else att_sorted[-1]
            attempt_stats.append({
                "attempt_num": att_num,
                "student_count": len(att_scores),
                "distribution": att_dist,
                "mean":       round(stats_lib.mean(att_scores), 1),
                "std_dev":    round(stats_lib.stdev(att_scores), 1) if len(att_scores) > 1 else 0.0,
                "median":     round(stats_lib.median(att_scores), 1),
                "min":        round(min(att_scores), 1),
                "max":        round(max(att_scores), 1),
                "q1":         att_q1,
                "q3":         att_q3,
                "pass_rate_50": round(sum(1 for sc in att_scores if sc >= 50) / len(att_scores) * 100, 1),
                "pass_rate_70": round(sum(1 for sc in att_scores if sc >= 70) / len(att_scores) * 100, 1)
            })

        min_avg_attempt = min(attempt_stats, key=lambda x: x["mean"])["attempt_num"] if attempt_stats else None
        max_avg_attempt = max(attempt_stats, key=lambda x: x["mean"])["attempt_num"] if attempt_stats else None

        hardest_classe_filter = "AND s.classe = %s" if classe else ""
        hardest_params = [concept_id, classe] if classe else [concept_id]
        cursor.execute(f"""
            SELECT dqr.exercise_id,
                   COALESCE(
                       json_extract(e.content_json, '$.question'),
                       json_extract(e.content_json, '$.statement'),
                       e.title
                   ) AS question_text,
                   e.exercise_type,
                   COUNT(*) AS total_att,
                   SUM(CASE WHEN dqr.is_correct = 0 THEN 1 ELSE 0 END) AS wrong_count
            FROM diagnostic_question_results dqr
            JOIN diagnostic_attempts da ON dqr.attempt_id = da.id
            JOIN students s ON da.student_id = s.id
            JOIN exercises e ON dqr.exercise_id = e.id
            WHERE da.concept_id = %s AND s.role = 'student' {hardest_classe_filter}
            GROUP BY dqr.exercise_id
            ORDER BY (CAST(wrong_count AS REAL) / total_att) DESC
            LIMIT 8
        """, hardest_params)
        hardest = []
        for r in cursor.fetchall():
            ex_id, qtext, qtype, total_att, wrong = r
            hardest.append({
                "exercise_id": ex_id,
                "question": (qtext or "")[:120],
                "type": qtype,
                "total_attempts": total_att,
                "wrong_count": int(wrong),
                "wrong_pct": round(int(wrong) / total_att * 100, 1) if total_att else 0
            })

        by_student: dict = {}
        for r in rows:
            sid, score = r[1], float(r[2])
            if sid not in by_student:
                by_student[sid] = {"first": score, "last": score}
            else:
                by_student[sid]["last"] = score

        improved = sum(1 for sv in by_student.values() if sv["last"] > sv["first"])
        same     = sum(1 for sv in by_student.values() if sv["last"] == sv["first"])
        declined = sum(1 for sv in by_student.values() if sv["last"] < sv["first"])
        deltas   = [sv["last"] - sv["first"] for sv in by_student.values() if sv["last"] != sv["first"]]
        avg_improvement = round(stats_lib.mean(deltas), 1) if deltas else 0.0

        results.append({
            "concept_id": concept_id,
            "concept_name": concept_name,
            "total_attempts": len(rows),
            "unique_students": unique_students,
            "score_stats": {
                "mean": round(mean_s, 1), "std_dev": round(std_s, 1),
                "min": round(min_s, 1),   "max": round(max_s, 1),
                "median": round(median_s, 1), "q1": round(q1, 1), "q3": round(q3, 1)
            },
            "distribution": dist,
            "pass_rate_50": pass_50,
            "pass_rate_70": pass_70,
            "hardest_questions": hardest,
            "progression": {
                "improved": improved, "same": same, "declined": declined,
                "avg_improvement": avg_improvement
            },
            "attempt_stats": attempt_stats,
            "min_avg_attempt": min_avg_attempt,
            "max_avg_attempt": max_avg_attempt
        })

    # Compute global scores as per-student test-attempt means (not raw per-concept scores)
    # Each entry = mean score of one student across all concepts for one attempt session
    global_scores: list = []
    global_attempt_scores: dict = {}  # {attempt_num: [per-student means]}
    for sid, att_data in global_per_student_per_attempt.items():
        for att_num, concept_scores in att_data.items():
            student_att_mean = stats_lib.mean(concept_scores)
            global_scores.append(student_att_mean)
            global_attempt_scores.setdefault(att_num, []).append(student_att_mean)

    # Global attempt stats (attempt N: one score per student = mean across all concepts)
    global_attempt_stats = []
    for att_num in sorted(global_attempt_scores.keys()):
        g_att = global_attempt_scores[att_num]
        g_att_sorted = sorted(g_att)
        g_att_n = len(g_att_sorted)
        g_att_q1 = round(stats_lib.median(g_att_sorted[:g_att_n // 2]), 1) if g_att_n >= 2 else g_att_sorted[0]
        g_att_q3 = round(stats_lib.median(g_att_sorted[(g_att_n + 1) // 2:]), 1) if g_att_n >= 2 else g_att_sorted[-1]
        g_att_dist: dict = {"0-20": 0, "20-40": 0, "40-60": 0, "60-80": 0, "80-100": 0}
        for sc in g_att:
            if sc < 20:   g_att_dist["0-20"]   += 1
            elif sc < 40: g_att_dist["20-40"]  += 1
            elif sc < 60: g_att_dist["40-60"]  += 1
            elif sc < 80: g_att_dist["60-80"]  += 1
            else:         g_att_dist["80-100"] += 1
        global_attempt_stats.append({
            "attempt_num": att_num,
            "count": len(g_att),
            "distribution": g_att_dist,
            "mean":       round(stats_lib.mean(g_att), 1),
            "std_dev":    round(stats_lib.stdev(g_att), 1) if len(g_att) > 1 else 0.0,
            "median":     round(stats_lib.median(g_att), 1),
            "min":        round(min(g_att), 1),
            "max":        round(max(g_att), 1),
            "q1": g_att_q1, "q3": g_att_q3,
            "pass_rate_50": round(sum(1 for sc in g_att if sc >= 50) / len(g_att) * 100, 1),
            "pass_rate_70": round(sum(1 for sc in g_att if sc >= 70) / len(g_att) * 100, 1)
        })

    # Global stats across all concepts of the sequence
    if global_scores:
        g = global_scores
        g_sorted = sorted(g)
        g_n = len(g_sorted)
        g_q1 = round(stats_lib.median(g_sorted[:g_n // 2]), 1) if g_n >= 2 else g_sorted[0]
        g_q3 = round(stats_lib.median(g_sorted[(g_n + 1) // 2:]), 1) if g_n >= 2 else g_sorted[-1]
        g_dist: dict = {"0-20": 0, "20-40": 0, "40-60": 0, "60-80": 0, "80-100": 0}
        for sc in g:
            if sc < 20:   g_dist["0-20"]   += 1
            elif sc < 40: g_dist["20-40"]  += 1
            elif sc < 60: g_dist["40-60"]  += 1
            elif sc < 80: g_dist["60-80"]  += 1
            else:         g_dist["80-100"] += 1
        g_min_att = min(global_attempt_stats, key=lambda x: x["mean"])["attempt_num"] if global_attempt_stats else None
        g_max_att = max(global_attempt_stats, key=lambda x: x["mean"])["attempt_num"] if global_attempt_stats else None
        global_stats = {
            "total_attempts": len(g),
            "unique_students": len(global_student_ids),
            "score_stats": {
                "mean":    round(stats_lib.mean(g), 1),
                "std_dev": round(stats_lib.stdev(g), 1) if len(g) > 1 else 0.0,
                "median":  round(stats_lib.median(g), 1),
                "min":     round(min(g), 1),
                "max":     round(max(g), 1),
                "q1": g_q1, "q3": g_q3
            },
            "distribution": g_dist,
            "pass_rate_50": round(sum(1 for sc in g if sc >= 50) / len(g) * 100, 1),
            "pass_rate_70": round(sum(1 for sc in g if sc >= 70) / len(g) * 100, 1),
            "attempt_stats": global_attempt_stats,
            "min_avg_attempt": g_min_att,
            "max_avg_attempt": g_max_att
        }
    else:
        global_stats = None

    conn.close()
    return {"sequence_name": sequence_name, "concepts": results, "global_stats": global_stats}


@router.get("/analytics/diagnostic-group")
async def get_diagnostic_group_stats(
    concept_id: int,
    admin_id: int = Depends(require_admin)
):
    """Group-level statistics for a concept's diagnostic test."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT name FROM concepts WHERE id = %s", (concept_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Concept not found")
    concept_name = row[0]

    cursor.execute("""
        SELECT da.id, da.student_id, da.score, da.created_at
        FROM diagnostic_attempts da
        JOIN students s ON da.student_id = s.id
        WHERE da.concept_id = %s AND s.role = 'student'
        ORDER BY da.created_at
    """, (concept_id,))
    rows = cursor.fetchall()

    if not rows:
        conn.close()
        return {
            "concept_name": concept_name,
            "total_attempts": 0, "unique_students": 0,
            "score_stats": None, "distribution": {},
            "pass_rate_50": 0, "pass_rate_70": 0,
            "hardest_questions": [], "progression": {}
        }

    scores = [float(r[2]) for r in rows]
    student_ids = [r[1] for r in rows]
    unique_students = len(set(student_ids))

    mean_s  = stats_lib.mean(scores)
    std_s   = stats_lib.stdev(scores) if len(scores) > 1 else 0.0
    min_s   = min(scores)
    max_s   = max(scores)
    median_s = stats_lib.median(scores)
    sorted_s = sorted(scores)
    n = len(sorted_s)
    q1 = stats_lib.median(sorted_s[:n // 2]) if n >= 2 else sorted_s[0]
    q3 = stats_lib.median(sorted_s[(n + 1) // 2:]) if n >= 2 else sorted_s[-1]

    dist = {"0-20": 0, "20-40": 0, "40-60": 0, "60-80": 0, "80-100": 0}
    for s in scores:
        if s < 20:   dist["0-20"]   += 1
        elif s < 40: dist["20-40"]  += 1
        elif s < 60: dist["40-60"]  += 1
        elif s < 80: dist["60-80"]  += 1
        else:        dist["80-100"] += 1

    pass_50 = round(sum(1 for s in scores if s >= 50) / len(scores) * 100, 1)
    pass_70 = round(sum(1 for s in scores if s >= 70) / len(scores) * 100, 1)

    # Per-question stats from diagnostic_question_results
    cursor.execute("""
        SELECT dqr.exercise_id,
               COALESCE(
                   json_extract(e.content_json, '$.question'),
                   json_extract(e.content_json, '$.statement'),
                   e.title
               ) AS question_text,
               e.exercise_type,
               COUNT(*) AS total_att,
               SUM(CASE WHEN dqr.is_correct = 0 THEN 1 ELSE 0 END) AS wrong_count
        FROM diagnostic_question_results dqr
        JOIN diagnostic_attempts da ON dqr.attempt_id = da.id
        JOIN students s ON da.student_id = s.id
        JOIN exercises e ON dqr.exercise_id = e.id
        WHERE da.concept_id = %s AND s.role = 'student'
        GROUP BY dqr.exercise_id
        ORDER BY (CAST(wrong_count AS REAL) / total_att) DESC
        LIMIT 8
    """, (concept_id,))
    hardest = []
    for r in cursor.fetchall():
        ex_id, qtext, qtype, total_att, wrong = r
        hardest.append({
            "exercise_id": ex_id,
            "question": (qtext or "")[:120],
            "type": qtype,
            "total_attempts": total_att,
            "wrong_count": int(wrong),
            "wrong_pct": round(int(wrong) / total_att * 100, 1) if total_att else 0
        })

    # Progression: first vs last score per student
    by_student: dict = {}
    for r in rows:
        sid, score = r[1], float(r[2])
        if sid not in by_student:
            by_student[sid] = {"first": score, "last": score}
        else:
            by_student[sid]["last"] = score

    improved = sum(1 for s in by_student.values() if s["last"] > s["first"])
    same     = sum(1 for s in by_student.values() if s["last"] == s["first"])
    declined = sum(1 for s in by_student.values() if s["last"] < s["first"])
    deltas   = [s["last"] - s["first"] for s in by_student.values() if s["last"] != s["first"]]
    avg_improvement = round(stats_lib.mean(deltas), 1) if deltas else 0.0

    conn.close()
    return {
        "concept_name": concept_name,
        "total_attempts": len(rows),
        "unique_students": unique_students,
        "score_stats": {
            "mean": round(mean_s, 1), "std_dev": round(std_s, 1),
            "min": round(min_s, 1),   "max": round(max_s, 1),
            "median": round(median_s, 1), "q1": round(q1, 1), "q3": round(q3, 1)
        },
        "distribution": dist,
        "pass_rate_50": pass_50,
        "pass_rate_70": pass_70,
        "hardest_questions": hardest,
        "progression": {
            "improved": improved, "same": same, "declined": declined,
            "avg_improvement": avg_improvement
        }
    }


@router.get("/analytics/students-overview")
async def get_students_overview(
    classe: Optional[str] = None,
    admin_id: int = Depends(require_admin)
):
    """Per-student scores across all concepts that have diagnostic exercises."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Concepts with diagnostic exercises
    cursor.execute("""
        SELECT DISTINCT c.id, c.name
        FROM concepts c
        JOIN exercises e ON e.concept_id = c.id
        WHERE e.is_diagnostic = 1 AND e.created_by_admin_id IS NOT NULL AND e.is_active = 1
        ORDER BY c.id
    """)
    concepts = [{"id": r[0], "name": r[1]} for r in cursor.fetchall()]

    # All students (optionally filtered by classe)
    if classe:
        cursor.execute(
            "SELECT id, username, created_at, classe FROM students WHERE role='student' AND classe=%s ORDER BY username",
            (classe,)
        )
    else:
        cursor.execute("SELECT id, username, created_at, classe FROM students WHERE role='student' ORDER BY username")
    students_raw = cursor.fetchall()

    students = []
    for sid, username, created_at, student_classe in students_raw:
        concept_scores: dict = {}
        for c in concepts:
            cursor.execute("""
                SELECT score, created_at FROM diagnostic_attempts
                WHERE student_id = %s AND concept_id = %s
                ORDER BY created_at
            """, (sid, c["id"]))
            atts = cursor.fetchall()
            if atts:
                concept_scores[str(c["id"])] = {
                    "attempts":     len(atts),
                    "first_score":  round(float(atts[0][0]), 1),
                    "latest_score": round(float(atts[-1][0]), 1),
                    "improvement":  round(float(atts[-1][0]) - float(atts[0][0]), 1)
                }
            else:
                concept_scores[str(c["id"])] = None

        scored = [v["latest_score"] for v in concept_scores.values() if v]
        students.append({
            "id": sid,
            "username": username,
            "classe": student_classe,
            "joined": (created_at or "")[:10],
            "scores": concept_scores,
            "overall_avg": round(stats_lib.mean(scored), 1) if scored else None,
            "concepts_attempted": len(scored)
        })

    conn.close()
    return {"concepts": concepts, "students": students}


@router.get("/analytics/student/{student_id}")
async def get_student_analytics(
    student_id: int,
    admin_id: int = Depends(require_admin)
):
    """Detailed analytics for a single student: per-concept progression + question stats."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id, username, email FROM students WHERE id=%s AND role='student'", (student_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Student not found")
    student = {"id": row[0], "username": row[1], "email": row[2]}

    # All attempts grouped by concept, ordered by date
    cursor.execute("""
        SELECT da.concept_id, c.name, da.score, da.created_at,
               COALESCE(m.mastery_level, 0.0)
        FROM diagnostic_attempts da
        JOIN concepts c ON da.concept_id = c.id
        LEFT JOIN mastery_state m ON m.concept_id = da.concept_id AND m.student_id = da.student_id
        WHERE da.student_id = %s
        ORDER BY da.concept_id, da.created_at
    """, (student_id,))

    concept_map: dict = {}
    for cid, cname, score, created_at, mastery in cursor.fetchall():
        if cid not in concept_map:
            concept_map[cid] = {
                "concept_id": cid, "concept_name": cname,
                "mastery_level": round(float(mastery) * 100, 1),
                "attempts": []
            }
        concept_map[cid]["attempts"].append({
            "attempt_num": len(concept_map[cid]["attempts"]) + 1,
            "score": round(float(score), 1),
            "date": (created_at or "")[:10]
        })

    result_list = []
    strong, weak = [], []
    for hist in concept_map.values():
        atts = hist["attempts"]
        first_s, last_s = atts[0]["score"], atts[-1]["score"]
        improvement = round(last_s - first_s, 1)
        hist["improvement"] = improvement
        hist["trend"] = "improving" if improvement > 5 else ("declining" if improvement < -5 else "stable")
        result_list.append(hist)
        if last_s >= 70:
            strong.append({"concept_name": hist["concept_name"], "score": last_s})
        elif last_s < 50:
            weak.append({"concept_name": hist["concept_name"], "score": last_s})

    # Per-question success rate for this student
    cursor.execute("""
        SELECT dqr.exercise_id,
               COALESCE(
                   json_extract(e.content_json, '$.question'),
                   json_extract(e.content_json, '$.statement'),
                   e.title
               ) AS qtext,
               e.exercise_type,
               COUNT(*) AS total,
               SUM(dqr.is_correct) AS correct_cnt
        FROM diagnostic_question_results dqr
        JOIN diagnostic_attempts da ON dqr.attempt_id = da.id
        JOIN exercises e ON dqr.exercise_id = e.id
        WHERE da.student_id = %s
        GROUP BY dqr.exercise_id
        ORDER BY (CAST(correct_cnt AS REAL) / total) ASC
    """, (student_id,))
    question_stats = []
    for r in cursor.fetchall():
        ex_id, qtext, qtype, total, correct_cnt = r
        question_stats.append({
            "exercise_id": ex_id,
            "question": (qtext or "")[:120],
            "type": qtype,
            "total_attempts": total,
            "correct_count": int(correct_cnt),
            "success_rate": round(int(correct_cnt) / total * 100, 1) if total else 0
        })

    conn.close()
    return {
        "student": student,
        "concept_histories": sorted(result_list, key=lambda x: x["concept_name"]),
        "strong_concepts": sorted(strong, key=lambda x: -x["score"]),
        "weak_concepts":   sorted(weak,   key=lambda x:  x["score"]),
        "question_stats": question_stats
    }
