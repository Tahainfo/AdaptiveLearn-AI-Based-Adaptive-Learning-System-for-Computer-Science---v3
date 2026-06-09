/* i18n.js — AdaptiveLearn Internationalization
 * Default language : French (fr)
 * Supported        : fr, en
 * API              : t(key), t(key, {param: value}), toggleLanguage(), setLanguage('en'), getCurrentLang()
 */

const _locales = {
    fr: {
        'page.title': "Système d'Apprentissage Adaptatif - Éducation Marocaine",

        'nav.dashboard':   'Tableau de bord',
        'nav.exercise':    'Exercice',
        'nav.diagnostic':  'Diagnostic',
        'nav.logout':      'Déconnexion',
        'nav.lang_switch': 'EN',

        'app.title':    "Système d'Apprentissage Adaptatif",
        'app.subtitle': 'Pour les lycéens marocains',

        'login.title':         'Connexion',
        'login.username':      "Nom d'utilisateur",
        'login.password':      'Mot de passe',
        'login.submit':        'Se connecter',
        'login.no_account':    "Vous n'avez pas de compte ?",
        'login.register_link': "S'inscrire ici",

        'register.title':      'Inscription',
        'register.email':      'Email',
        'register.submit':     "S'inscrire",
        'register.has_account':'Vous avez déjà un compte ?',
        'register.login_link': 'Se connecter ici',

        'auth.fill_all_fields': 'Veuillez remplir tous les champs',
        'auth.login_failed':    'Échec de la connexion',
        'auth.register_success':"Inscription réussie ! Veuillez vous connecter.",
        'auth.register_failed': "Échec de l'inscription",
        'auth.logout_confirm':  'Êtes-vous sûr de vouloir vous déconnecter ?',

        'dashboard.title':              'Tableau de bord',
        'dashboard.overall_progress':   'Progression globale',
        'dashboard.mastery_start':      'Commencez à apprendre pour suivre votre progression...',
        'dashboard.sequences_validated':     'Séquences validées',
        'dashboard.sequences_validated_sub': 'séquences avec badge obtenu',
        'dashboard.best_sequence':           'Meilleure séquence',
        'dashboard.no_data_yet':             '—',
        'dashboard.modules':            'Modules',
        'dashboard.mastery_hierarchy':  'Hiérarchie de maîtrise',
        'dashboard.what_to_learn':      'Quoi apprendre ensuite',
        'dashboard.mastery_0':          'Vous débutez à peine ! Continuez à apprendre.',
        'dashboard.mastery_1':          'Bonne progression ! Continuez à pratiquer.',
        'dashboard.mastery_2':          'Vous progressez bien. Restez régulier !',
        'dashboard.mastery_3':          'Excellente maîtrise ! Vous vous en sortez très bien.',
        'dashboard.mastery_4':          "Exceptionnel ! Vous avez maîtrisé la plupart des notions !",
        'dashboard.no_mastery_data':    'Commencez des exercices pour construire votre profil de maîtrise !',
        'dashboard.mastery_load_error': 'Impossible de charger les données de maîtrise. Veuillez réessayer.',
        'dashboard.load_error':         'Impossible de charger le tableau de bord',
        'dashboard.next_step':          'Votre prochaine étape',
        'dashboard.algorithmics_path':  'Parcours Algorithmique',
        'dashboard.status':             'Statut',
        'dashboard.sequences':          'séquences',

        'exercise.title':              'Mode Exercice',
        'exercise.exercise_label':     'Exercice :',
        'exercise.loading':            "Chargement de l'exercice...",
        'exercise.get_hint':           'Obtenir un indice',
        'exercise.your_answer':        'Votre réponse :',
        'exercise.answer_placeholder': 'Entrez votre pseudocode ou solution...',
        'exercise.submit':             'Soumettre la réponse',
        'exercise.next':               'Exercice suivant',
        'exercise.correct':            'Bonne réponse !',
        'exercise.incorrect':          'Pas tout à fait',
        'exercise.feedback_label':     'Retour',
        'exercise.hint_label':         'Indice',
        'exercise.new_mastery':        'Votre nouvelle maîtrise',
        'exercise.no_hints':           'Aucun indice supplémentaire disponible',
        'exercise.hint_error':         "Impossible de charger l'indice",
        'exercise.diagnostic_required':"Veuillez d'abord compléter un test de diagnostic !",
        'exercise.load_error':         "Erreur lors du chargement de l'exercice",
        'exercise.enter_answer':       'Veuillez saisir votre réponse',
        'exercise.submit_error':       'Erreur lors de la soumission de la réponse',

        'diagnostic.title':                'Test de diagnostic',
        'diagnostic.subtitle':             'Évaluons vos connaissances actuelles',
        'diagnostic.select_concept':       'Sélectionnez un concept à tester',
        'diagnostic.answer_questions':     'Répondez aux questions',
        'diagnostic.submit_test':          'Soumettre le test',
        'diagnostic.submit_modal':         'Soumettre le diagnostic',
        'diagnostic.results':              'Résultats du test',
        'diagnostic.back_dashboard':       'Retour au tableau de bord',
        'diagnostic.retake':               'Refaire le test',
        'diagnostic.correctives_btn':      'Exercices correctifs',
        'diagnostic.no_exercises_title':   'Aucun exercice de diagnostic disponible',
        'diagnostic.no_exercises_msg':     "L'administrateur n'a pas encore ajouté d'exercices de diagnostic pour ce concept. Veuillez sélectionner un autre concept ou vérifiez plus tard.",
        'diagnostic.no_exercises_seq_title':'Aucun exercice de diagnostic',
        'diagnostic.no_exercises_seq_msg': "L'administrateur n'a pas encore ajouté d'exercices de diagnostic pour la séquence <strong>{title}</strong>.<br>Veuillez demander à votre enseignant de créer des exercices de diagnostic.",
        'diagnostic.please_answer_all':    'Veuillez répondre à toutes les questions',
        'diagnostic.unanswered_questions': 'Veuillez répondre à toutes les questions. Sans réponse : Question(s) {numbers}',
        'diagnostic.load_concepts_error':  'Impossible de charger les concepts',
        'diagnostic.load_questions_error': 'Impossible de charger les questions',
        'diagnostic.submit_error':         'Impossible de soumettre le test',
        'diagnostic.load_error':           'Impossible de charger le diagnostic',
        'diagnostic.question_label':       'Question',
        'diagnostic.text_placeholder':          'Tapez votre réponse ici',
        'diagnostic.long_answer_placeholder':   'Rédigez votre réponse complète ici...',
        'diagnostic.drag_drop_instruction':     'Utilisez ▲ ▼ pour réordonner les éléments du plus simple au plus complexe.',
        'diagnostic.match_lines_instruction':   'Associez chaque terme de gauche à son correspondant de droite.',
        'diagnostic.match_select_placeholder':  '-- Choisir --',
        'diagnostic.previous':             '← Précédent',
        'diagnostic.next_btn':             'Suivant →',
        'diagnostic.submit_fullscreen':    '✓ Soumettre le test',
        'diagnostic.test_covering':        'Test couvrant {n} concepts',
        'diagnostic.start_diagnostic':     'Démarrer le test de diagnostic',
        'diagnostic.concepts_notions':     'concepts/notions',
        'diagnostic.mastery_recorded':     'Maîtrise enregistrée pour cette séquence.',
        'diagnostic.diagnostic_results':   'Résultats du diagnostic',
        'diagnostic.score_colon':          'Score :',

        'module.load_error':        'Erreur lors du chargement des modules',
        'module.load_module_error': 'Impossible de charger le module',
        'module.open':              'Voir le module',

        'reward.download_certificate':  'Télécharger le certificat',
        'reward.certificate_title':     'Certificat de réussite',
        'reward.certificate_awarded_to':'Ce certificat est décerné à',
        'reward.certificate_module':    'Module complété',
        'reward.cert_sequence':         'Séquence',
        'reward.cert_score':            'Score',
        'reward.cert_badge':            'Badge',

        'review.diagnostic_review': 'Révision du diagnostic',
        'review.correct_out_of':    '{correct} correcte(s) sur {total} questions',
        'review.score':             'Score',
        'review.short_answer':  'Réponse courte',
        'review.long_answer':   'Réponse longue',
        'review.drag_drop':     'Réordonner',
        'review.match_lines':   'Association',
        'review.true_false':    'Vrai / Faux',
        'review.mcq':           'QCM',
        'review.explain_btn':       'Expliquer la bonne réponse',
        'review.generating':        'Génération en cours…',
        'review.ai_explanation':    'Explication IA',
        'review.explanation_error': "Impossible de charger l'explication",
        'review.no_answer':         '(aucune réponse)',
        'review.not_answered':      '(non répondu)',

        'guide.title':      'Diagnostic / Bilan pédagogique',
        'guide.subtitle':   'Analyse IA personnalisée basée sur tes résultats',
        'guide.summary':    'Ton bilan',
        'guide.weak_areas': 'Points à renforcer',
        'guide.key_lessons':'Leçons essentielles',
        'guide.action_plan':"Ton plan d'action",
        'guide.strengths':  'Ce que tu maîtrises bien',
        'guide.error':      "Impossible de générer le guide pour l'instant",
        'guide.retry':      'Réessayer',
        'guide.empty':      'Le guide n\'a pas pu être généré correctement.',
        'guide.ai_loading_title':    'Analyse IA en cours…',
        'guide.ai_loading_subtitle': 'Génération de votre bilan pédagogique personnalisé',
        'guide.ai_step_1':           'Analyse des réponses',
        'guide.ai_step_2':           'Identification des lacunes',
        'guide.ai_step_3':           'Génération du bilan',

        'corrective.title':            'Exercices correctifs',
        'corrective.subtitle':         'Exercices ciblés basés sur tes erreurs',
        'corrective.question_of':      'Question {n} sur {total}',
        'corrective.submit':           'Valider ma réponse',
        'corrective.correct_answer':   '✓ Bonne réponse !',
        'corrective.wrong_answer':     '✗ Mauvaise réponse',
        'corrective.correct_was':      'La bonne réponse était :',
        'corrective.explanation':      'Explication',
        'corrective.next':             'Exercice suivant →',
        'corrective.see_results':      'Voir mes résultats',
        'corrective.generating':       'Génération en cours…',
        'corrective.generate_error':   'Impossible de générer les exercices',
        'corrective.end_title':        'Exercices terminés !',
        'corrective.end_msg_perfect':  'Parfait ! Tu as répondu correctement à tous les exercices. Continue comme ça !',
        'corrective.end_msg_good':     'Bon travail ! Continue à pratiquer pour renforcer tes connaissances.',
        'corrective.end_msg_keep_going':'Continue tes efforts ! Relis les explications et retente le test de diagnostic.',
        'corrective.back_to_review':   '← Retour à la révision',
        'corrective.dashboard':        'Tableau de bord',

        'common.ok': 'OK'
    },

    en: {
        'page.title': 'Adaptive Learning System - Moroccan Education',

        'nav.dashboard':   'Dashboard',
        'nav.exercise':    'Exercise',
        'nav.diagnostic':  'Diagnostic',
        'nav.logout':      'Logout',
        'nav.lang_switch': 'FR',

        'app.title':    'Adaptive Learning System',
        'app.subtitle': 'For Moroccan High School Students',

        'login.title':         'Login',
        'login.username':      'Username',
        'login.password':      'Password',
        'login.submit':        'Login',
        'login.no_account':    "Don't have an account?",
        'login.register_link': 'Register here',

        'register.title':      'Register',
        'register.email':      'Email',
        'register.submit':     'Register',
        'register.has_account':'Already have an account?',
        'register.login_link': 'Login here',

        'auth.fill_all_fields': 'Please fill in all fields',
        'auth.login_failed':    'Login failed',
        'auth.register_success':'Registration successful! Please login.',
        'auth.register_failed': 'Registration failed',
        'auth.logout_confirm':  'Are you sure you want to logout?',

        'dashboard.title':              'Your Learning Dashboard',
        'dashboard.overall_progress':   'Overall Progress',
        'dashboard.mastery_start':      'Start learning to track your progress...',
        'dashboard.sequences_validated':     'Validated Sequences',
        'dashboard.sequences_validated_sub': 'sequences with badge earned',
        'dashboard.best_sequence':           'Best Sequence',
        'dashboard.no_data_yet':             '—',
        'dashboard.modules':            'Modules',
        'dashboard.mastery_hierarchy':  'Mastery Hierarchy',
        'dashboard.what_to_learn':      'What to Learn Next',
        'dashboard.mastery_0':          "You're just getting started! Keep learning.",
        'dashboard.mastery_1':          'Good progress! Keep practicing.',
        'dashboard.mastery_2':          "You're developing well. Stay consistent!",
        'dashboard.mastery_3':          "Great mastery! You're doing excellent.",
        'dashboard.mastery_4':          "Outstanding! You've mastered most concepts!",
        'dashboard.no_mastery_data':    'Start taking exercises to build your mastery profile!',
        'dashboard.mastery_load_error': 'Unable to load mastery data. Please try again.',
        'dashboard.load_error':         'Failed to load dashboard',
        'dashboard.next_step':          'Your Next Step',
        'dashboard.algorithmics_path':  'Algorithmics Path',
        'dashboard.status':             'Status',
        'dashboard.sequences':          'sequences',

        'exercise.title':              'Exercise Mode',
        'exercise.exercise_label':     'Exercise:',
        'exercise.loading':            'Loading exercise...',
        'exercise.get_hint':           'Get Hint',
        'exercise.your_answer':        'Your Answer:',
        'exercise.answer_placeholder': 'Enter your pseudocode or solution...',
        'exercise.submit':             'Submit Answer',
        'exercise.next':               'Next Exercise',
        'exercise.correct':            'Correct!',
        'exercise.incorrect':          'Not Quite Right',
        'exercise.feedback_label':     'Feedback',
        'exercise.hint_label':         'Hint',
        'exercise.new_mastery':        'Your New Mastery',
        'exercise.no_hints':           'No more hints available',
        'exercise.hint_error':         'Could not load hint',
        'exercise.diagnostic_required':'Please complete a diagnostic test first!',
        'exercise.load_error':         'Error loading exercise',
        'exercise.enter_answer':       'Please enter your answer',
        'exercise.submit_error':       'Error submitting answer',

        'diagnostic.title':                'Diagnostic Test',
        'diagnostic.subtitle':             "Let's assess your current knowledge",
        'diagnostic.select_concept':       'Select a Concept to Test',
        'diagnostic.answer_questions':     'Answer the Questions',
        'diagnostic.submit_test':          'Submit Test',
        'diagnostic.submit_modal':         'Submit Diagnostic',
        'diagnostic.results':              'Test Results',
        'diagnostic.back_dashboard':       'Back to Dashboard',
        'diagnostic.retake':               'Retake Test',
        'diagnostic.correctives_btn':      'Corrective Exercises',
        'diagnostic.no_exercises_title':   'No diagnostic exercises available yet',
        'diagnostic.no_exercises_msg':     'The administrator has not added any diagnostic exercises for this concept. Please select a different concept or check back later.',
        'diagnostic.no_exercises_seq_title':'No Diagnostic Exercises Yet',
        'diagnostic.no_exercises_seq_msg': 'The administrator has not added any diagnostic exercises for the <strong>{title}</strong> sequence yet.<br>Please ask your teacher to create diagnostic exercises.',
        'diagnostic.please_answer_all':    'Please answer all questions',
        'diagnostic.unanswered_questions': 'Please answer all questions. Unanswered: Question(s) {numbers}',
        'diagnostic.load_concepts_error':  'Failed to load concepts',
        'diagnostic.load_questions_error': 'Failed to load questions',
        'diagnostic.submit_error':         'Failed to submit test',
        'diagnostic.load_error':           'Failed to load diagnostic',
        'diagnostic.question_label':       'Question',
        'diagnostic.text_placeholder':          'Type your answer here',
        'diagnostic.long_answer_placeholder':   'Write your complete answer here...',
        'diagnostic.drag_drop_instruction':     'Use ▲ ▼ to reorder the items from simplest to most complex.',
        'diagnostic.match_lines_instruction':   'Match each term on the left to its corresponding item on the right.',
        'diagnostic.match_select_placeholder':  '-- Select --',
        'diagnostic.previous':             '← Previous',
        'diagnostic.next_btn':             'Next →',
        'diagnostic.submit_fullscreen':    '✓ Submit Test',
        'diagnostic.test_covering':        'Test covering {n} concepts',
        'diagnostic.start_diagnostic':     'Start Diagnostic Test',
        'diagnostic.concepts_notions':     'concepts/notions',
        'diagnostic.mastery_recorded':     'Mastery recorded for this sequence.',
        'diagnostic.diagnostic_results':   'Diagnostic Results',
        'diagnostic.score_colon':          'Score:',

        'module.load_error':        'Error loading modules',
        'module.load_module_error': 'Failed to load module',
        'module.open':              'View Module',

        'reward.download_certificate':  'Download Certificate',
        'reward.certificate_title':     'Certificate of Achievement',
        'reward.certificate_awarded_to':'This certificate is awarded to',
        'reward.certificate_module':    'Completed Module',
        'reward.cert_sequence':         'Sequence',
        'reward.cert_score':            'Score',
        'reward.cert_badge':            'Badge',

        'review.diagnostic_review': 'Diagnostic Review',
        'review.correct_out_of':    '{correct} correct out of {total} questions',
        'review.score':             'Score',
        'review.short_answer':  'Short Answer',
        'review.long_answer':   'Long Answer',
        'review.drag_drop':     'Ordering',
        'review.match_lines':   'Match Lines',
        'review.true_false':    'True / False',
        'review.mcq':           'MCQ',
        'review.explain_btn':       'Explain the correct answer',
        'review.generating':        'Generating…',
        'review.ai_explanation':    'AI Explanation',
        'review.explanation_error': 'Could not load explanation',
        'review.no_answer':         '(no answer)',
        'review.not_answered':      '(not answered)',

        'guide.title':      'What You Should Learn From This Test',
        'guide.subtitle':   'Personalized AI analysis based on your results',
        'guide.summary':    'Your Summary',
        'guide.weak_areas': 'Areas to Strengthen',
        'guide.key_lessons':'Key Lessons',
        'guide.action_plan':'Your Action Plan',
        'guide.strengths':  'What You Master Well',
        'guide.error':      'Could not generate the guide at the moment',
        'guide.retry':      'Retry',
        'guide.empty':      'The guide could not be generated correctly.',
        'guide.ai_loading_title':    'AI Analysis in Progress…',
        'guide.ai_loading_subtitle': 'Generating your personalized learning report',
        'guide.ai_step_1':           'Analyzing responses',
        'guide.ai_step_2':           'Identifying gaps',
        'guide.ai_step_3':           'Generating report',

        'corrective.title':            'Corrective Exercises',
        'corrective.subtitle':         'Targeted exercises based on your mistakes',
        'corrective.question_of':      'Question {n} of {total}',
        'corrective.submit':           'Validate my answer',
        'corrective.correct_answer':   '✓ Correct Answer!',
        'corrective.wrong_answer':     '✗ Wrong Answer',
        'corrective.correct_was':      'The correct answer was:',
        'corrective.explanation':      'Explanation',
        'corrective.next':             'Next Exercise →',
        'corrective.see_results':      'See My Results',
        'corrective.generating':       'Generating…',
        'corrective.generate_error':   'Could not generate exercises',
        'corrective.end_title':        'Exercises Completed!',
        'corrective.end_msg_perfect':  'Perfect! You answered all exercises correctly. Keep it up!',
        'corrective.end_msg_good':     'Good work! Keep practicing to reinforce your knowledge.',
        'corrective.end_msg_keep_going':'Keep going! Review the explanations and retake the diagnostic test.',
        'corrective.back_to_review':   '← Back to Review',
        'corrective.dashboard':        'Dashboard',

        'common.ok': 'OK'
    }
};

/* ── Active language (persisted in localStorage, default: French) ── */
let _lang = localStorage.getItem('lang') || 'fr';

/**
 * Translate a key, with optional {param} interpolation.
 * Falls back to French then to the raw key if missing.
 */
function t(key, params) {
    const dict = _locales[_lang] || _locales.fr;
    let str = dict[key];
    if (str === undefined) str = (_locales.fr[key] !== undefined) ? _locales.fr[key] : key;
    if (params) {
        for (const k of Object.keys(params)) {
            str = str.split('{' + k + '}').join(String(params[k]));
        }
    }
    return str;
}

function getCurrentLang() { return _lang; }

/**
 * Switch UI language and persist to localStorage.
 * Fires a 'languageChanged' CustomEvent on document.
 */
function setLanguage(lang) {
    if (!_locales[lang]) return;
    _lang = lang;
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
    _applyTranslations();
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
}

function toggleLanguage() {
    setLanguage(_lang === 'fr' ? 'en' : 'fr');
}

/* Update every element that carries a data-i18n / data-i18n-placeholder attribute */
function _applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
    });
    document.title = t('page.title');
}

document.addEventListener('DOMContentLoaded', () => {
    _applyTranslations();
});
