import {
  type Question,
  type InsertQuestion,
  type Test,
  type InsertTest,
  type FlashcardDeck,
  type InsertFlashcardDeck,
  type Flashcard,
  type InsertFlashcard,
  type Note,
  type InsertNote,
  type StudyTask,
  type InsertStudyTask,
  type Article,
  type InsertArticle,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Questions
  getQuestions(): Promise<Question[]>;
  getQuestion(id: string): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  searchQuestions(filters: {
    subject?: string;
    system?: string;
    status?: string;
    searchTerm?: string;
  }): Promise<Question[]>;

  // Tests
  getTests(): Promise<Test[]>;
  getTest(id: string): Promise<Test | undefined>;
  createTest(test: InsertTest): Promise<Test>;
  updateTest(id: string, updates: Partial<Test>): Promise<Test | undefined>;
  deleteTest(id: string): Promise<boolean>;

  // Flashcard Decks
  getFlashcardDecks(): Promise<FlashcardDeck[]>;
  getFlashcardDeck(id: string): Promise<FlashcardDeck | undefined>;
  createFlashcardDeck(deck: InsertFlashcardDeck): Promise<FlashcardDeck>;
  updateFlashcardDeck(id: string, updates: Partial<FlashcardDeck>): Promise<FlashcardDeck | undefined>;
  deleteFlashcardDeck(id: string): Promise<boolean>;

  // Flashcards
  getFlashcards(deckId: string): Promise<Flashcard[]>;
  getFlashcard(id: string): Promise<Flashcard | undefined>;
  createFlashcard(flashcard: InsertFlashcard): Promise<Flashcard>;
  updateFlashcard(id: string, updates: Partial<Flashcard>): Promise<Flashcard | undefined>;
  deleteFlashcard(id: string): Promise<boolean>;

  // Notes
  getNotes(): Promise<Note[]>;
  getNote(id: string): Promise<Note | undefined>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: string, updates: Partial<Note>): Promise<Note | undefined>;
  deleteNote(id: string): Promise<boolean>;

  // Study Tasks
  getStudyTasks(): Promise<StudyTask[]>;
  getStudyTask(id: string): Promise<StudyTask | undefined>;
  createStudyTask(task: InsertStudyTask): Promise<StudyTask>;
  updateStudyTask(id: string, updates: Partial<StudyTask>): Promise<StudyTask | undefined>;
  deleteStudyTask(id: string): Promise<boolean>;

  // Articles
  getArticles(): Promise<Article[]>;
  getArticle(id: string): Promise<Article | undefined>;
  searchArticles(filters: { searchTerm?: string; type?: string }): Promise<Article[]>;
}

export class MemStorage implements IStorage {
  private questions: Map<string, Question>;
  private tests: Map<string, Test>;
  private flashcardDecks: Map<string, FlashcardDeck>;
  private flashcards: Map<string, Flashcard>;
  private notes: Map<string, Note>;
  private studyTasks: Map<string, StudyTask>;
  private articles: Map<string, Article>;

  constructor() {
    this.questions = new Map();
    this.tests = new Map();
    this.flashcardDecks = new Map();
    this.flashcards = new Map();
    this.notes = new Map();
    this.studyTasks = new Map();
    this.articles = new Map();
    
    this.seedData();
  }

  private seedData() {
    // Seed sample USMLE questions
    const sampleQuestions: InsertQuestion[] = [
      {
        text: "A 45-year-old man with a history of hypertension presents with sudden onset chest pain radiating to the left arm. ECG shows ST-segment elevation in leads II, III, and aVF. Which coronary artery is most likely occluded?",
        options: ["Right coronary artery", "Left anterior descending artery", "Left circumflex artery", "Posterior descending artery"],
        correctAnswer: "Right coronary artery",
        explanation: "ST elevation in leads II, III, and aVF indicates inferior wall MI, typically caused by right coronary artery occlusion.",
        subject: "Pathology",
        system: "cardio",
        difficulty: "Medium",
        status: "correct",
        yourAnswer: "Right coronary artery",
      },
      {
        text: "A 32-year-old woman presents with fatigue, weight gain, cold intolerance, and constipation. Laboratory studies show elevated TSH and low T4. What is the most likely diagnosis?",
        options: ["Primary hypothyroidism", "Secondary hypothyroidism", "Hyperthyroidism", "Subclinical hypothyroidism"],
        correctAnswer: "Primary hypothyroidism",
        explanation: "Elevated TSH with low T4 indicates primary hypothyroidism, where the thyroid gland itself is failing.",
        subject: "Pathophysiology",
        system: "endo",
        difficulty: "Easy",
        status: "incorrect",
        yourAnswer: "Secondary hypothyroidism",
      },
      {
        text: "Which of the following medications is most appropriate for treating acute migraine?",
        options: ["Sumatriptan", "Propranolol", "Amitriptyline", "Topiramate"],
        correctAnswer: "Sumatriptan",
        explanation: "Sumatriptan is a triptan medication used for acute migraine treatment. Propranolol and topiramate are preventive medications.",
        subject: "Pharmacology",
        system: "neuro",
        difficulty: "Medium",
        status: "unseen",
      },
      {
        text: "A patient with diabetes mellitus type 2 is started on metformin. What is the mechanism of action?",
        options: ["Decreases hepatic glucose production", "Increases insulin secretion", "Delays carbohydrate absorption", "Increases peripheral glucose uptake"],
        correctAnswer: "Decreases hepatic glucose production",
        explanation: "Metformin primarily works by decreasing hepatic glucose production and improving insulin sensitivity.",
        subject: "Pharmacology",
        system: "endo",
        difficulty: "Easy",
        status: "unseen",
      },
      {
        text: "The brachial plexus is formed by nerve roots from which spinal levels?",
        options: ["C5-T1", "C3-C7", "C6-T2", "C4-C8"],
        correctAnswer: "C5-T1",
        explanation: "The brachial plexus is formed from nerve roots C5, C6, C7, C8, and T1.",
        subject: "Anatomy",
        system: "neuro",
        difficulty: "Easy",
        status: "unseen",
      },
      {
        text: "A patient presents with sudden difficulty breathing and chest pain after a long flight. Which condition is most likely?",
        options: ["Pulmonary embolism", "Pneumonia", "Asthma exacerbation", "COPD exacerbation"],
        correctAnswer: "Pulmonary embolism",
        explanation: "Prolonged immobility during flight increases risk of deep vein thrombosis and pulmonary embolism.",
        subject: "Pathology",
        system: "pulm",
        difficulty: "Medium",
        status: "unseen",
      },
      {
        text: "What is the primary function of immunoglobulin E (IgE)?",
        options: ["Allergic reactions and parasitic infections", "Mucosal immunity", "Opsonization", "Complement activation"],
        correctAnswer: "Allergic reactions and parasitic infections",
        explanation: "IgE is primarily involved in allergic reactions and defense against parasitic infections.",
        subject: "Immunology",
        system: "allergy",
        difficulty: "Easy",
        status: "unseen",
      },
      {
        text: "Which biochemical pathway is the primary source of NADPH in cells?",
        options: ["Pentose phosphate pathway", "Glycolysis", "Krebs cycle", "Electron transport chain"],
        correctAnswer: "Pentose phosphate pathway",
        explanation: "The pentose phosphate pathway generates NADPH, which is essential for biosynthetic reactions and antioxidant defense.",
        subject: "Biochemistry",
        system: "biochem-general",
        difficulty: "Medium",
        status: "unseen",
      },
      {
        text: "A 28-year-old woman presents with bloody diarrhea and abdominal cramping. Colonoscopy shows continuous inflammation of the colonic mucosa. What is the most likely diagnosis?",
        options: ["Ulcerative colitis", "Crohn disease", "Irritable bowel syndrome", "Celiac disease"],
        correctAnswer: "Ulcerative colitis",
        explanation: "Ulcerative colitis typically presents with continuous inflammation limited to the colon and rectum.",
        subject: "Pathology",
        system: "gi",
        difficulty: "Medium",
        status: "unseen",
      },
      {
        text: "Which organism is the most common cause of community-acquired pneumonia?",
        options: ["Streptococcus pneumoniae", "Haemophilus influenzae", "Mycoplasma pneumoniae", "Staphylococcus aureus"],
        correctAnswer: "Streptococcus pneumoniae",
        explanation: "Streptococcus pneumoniae is the most common bacterial cause of community-acquired pneumonia.",
        subject: "Microbiology",
        system: "infectious",
        difficulty: "Easy",
        status: "unseen",
      },
      {
        text: "During cardiac development, which structure gives rise to the aorta and pulmonary trunk?",
        options: ["Truncus arteriosus", "Bulbus cordis", "Primitive atrium", "Sinus venosus"],
        correctAnswer: "Truncus arteriosus",
        explanation: "The truncus arteriosus divides to form the ascending aorta and pulmonary trunk.",
        subject: "Embryology",
        system: "cardio",
        difficulty: "Hard",
        status: "unseen",
      },
      {
        text: "What is the inheritance pattern of sickle cell disease?",
        options: ["Autosomal recessive", "Autosomal dominant", "X-linked recessive", "X-linked dominant"],
        correctAnswer: "Autosomal recessive",
        explanation: "Sickle cell disease follows an autosomal recessive inheritance pattern.",
        subject: "Genetics",
        system: "heme-onc",
        difficulty: "Easy",
        status: "unseen",
      },
      {
        text: "Which type of collagen is most abundant in bone?",
        options: ["Type I", "Type II", "Type III", "Type IV"],
        correctAnswer: "Type I",
        explanation: "Type I collagen is the most abundant collagen in bone, providing tensile strength.",
        subject: "Histology",
        system: "rheum",
        difficulty: "Easy",
        status: "unseen",
      },
      {
        text: "A patient with chronic kidney disease presents with fatigue and pallor. What is the most likely cause of anemia?",
        options: ["Decreased erythropoietin production", "Iron deficiency", "Vitamin B12 deficiency", "Hemolysis"],
        correctAnswer: "Decreased erythropoietin production",
        explanation: "Chronic kidney disease leads to decreased erythropoietin production, causing anemia.",
        subject: "Pathophysiology",
        system: "renal",
        difficulty: "Medium",
        status: "unseen",
      },
      {
        text: "Which structure controls the release of hormones from the pituitary gland?",
        options: ["Hypothalamus", "Thalamus", "Pineal gland", "Adrenal cortex"],
        correctAnswer: "Hypothalamus",
        explanation: "The hypothalamus regulates pituitary hormone secretion through releasing and inhibiting hormones.",
        subject: "Physiology",
        system: "endo",
        difficulty: "Easy",
        status: "unseen",
      },
      // Additional questions for comprehensive coverage
      {
        text: "A patient presents with a painless ulcer on the genitals. Darkfield microscopy reveals spirochetes. What is the most likely diagnosis?",
        options: ["Primary syphilis", "Herpes simplex", "Chancroid", "Lymphogranuloma venereum"],
        correctAnswer: "Primary syphilis",
        explanation: "Painless genital ulcer (chancre) with spirochetes visible on darkfield microscopy is diagnostic of primary syphilis.",
        subject: "Microbiology",
        system: "infectious",
        difficulty: "Medium",
        status: "unseen",
      },
      {
        text: "A 55-year-old woman presents with a pruritic rash on her wrists and ankles. Physical exam shows flat-topped, polygonal, purple papules. What is the diagnosis?",
        options: ["Lichen planus", "Psoriasis", "Eczema", "Pityriasis rosea"],
        correctAnswer: "Lichen planus",
        explanation: "The 6 Ps of lichen planus: Pruritic, Purple, Polygonal, Planar (flat-topped) Papules and Plaques.",
        subject: "Pathology",
        system: "derm",
        difficulty: "Medium",
        status: "unseen",
      },
      {
        text: "Which statistical test is most appropriate for comparing means between two independent groups?",
        options: ["Student's t-test", "Chi-square test", "ANOVA", "Pearson correlation"],
        correctAnswer: "Student's t-test",
        explanation: "Student's t-test is used to compare means between two independent groups.",
        subject: "Biostatistics",
        system: "biostats",
        difficulty: "Easy",
        status: "unseen",
      },
      {
        text: "What is the treatment of choice for acetaminophen overdose?",
        options: ["N-acetylcysteine", "Naloxone", "Flumazenil", "Activated charcoal alone"],
        correctAnswer: "N-acetylcysteine",
        explanation: "N-acetylcysteine is the antidote for acetaminophen overdose, providing glutathione precursors.",
        subject: "Pharmacology",
        system: "poisoning",
        difficulty: "Easy",
        status: "unseen",
      },
      {
        text: "A 25-year-old man presents with recurrent nosebleeds and telangiectasias on his lips and fingers. His father had similar symptoms. What is the diagnosis?",
        options: ["Hereditary hemorrhagic telangiectasia", "von Willebrand disease", "Hemophilia A", "ITP"],
        correctAnswer: "Hereditary hemorrhagic telangiectasia",
        explanation: "Hereditary hemorrhagic telangiectasia (Osler-Weber-Rendu syndrome) presents with telangiectasias and recurrent epistaxis.",
        subject: "Genetics",
        system: "genetics-general",
        difficulty: "Medium",
        status: "unseen",
      },
      {
        text: "A patient with schizophrenia is started on haloperidol. What is the most common extrapyramidal side effect?",
        options: ["Acute dystonia", "Tardive dyskinesia", "Neuroleptic malignant syndrome", "Akathisia"],
        correctAnswer: "Acute dystonia",
        explanation: "Acute dystonia is the most common early extrapyramidal side effect of typical antipsychotics like haloperidol.",
        subject: "Pharmacology",
        system: "psych",
        difficulty: "Medium",
        status: "unseen",
      },
      {
        text: "What is the first-line treatment for otitis media in a child with penicillin allergy?",
        options: ["Azithromycin", "Ciprofloxacin", "Ceftriaxone", "Gentamicin"],
        correctAnswer: "Azithromycin",
        explanation: "Azithromycin is a safe alternative for treating otitis media in penicillin-allergic patients.",
        subject: "Pharmacology",
        system: "ent",
        difficulty: "Easy",
        status: "unseen",
      },
      {
        text: "A newborn has ambiguous genitalia and salt-wasting crisis at 2 weeks of age. 17-hydroxyprogesterone is elevated. What enzyme is deficient?",
        options: ["21-hydroxylase", "11-hydroxylase", "17-hydroxylase", "3-beta-hydroxysteroid dehydrogenase"],
        correctAnswer: "21-hydroxylase",
        explanation: "21-hydroxylase deficiency is the most common cause of congenital adrenal hyperplasia, presenting with virilization and salt-wasting.",
        subject: "Pathophysiology",
        system: "endo",
        difficulty: "Hard",
        status: "unseen",
      },
      {
        text: "A pregnant woman at 20 weeks gestation has a fundal height of 28 cm. Ultrasound shows excessive amniotic fluid. What is this condition called?",
        options: ["Polyhydramnios", "Oligohydramnios", "Placenta previa", "Abruptio placentae"],
        correctAnswer: "Polyhydramnios",
        explanation: "Polyhydramnios is excessive amniotic fluid, often associated with fetal anomalies or maternal diabetes.",
        subject: "Pathophysiology",
        system: "preg",
        difficulty: "Easy",
        status: "unseen",
      },
      {
        text: "What is the most common cause of painless vaginal bleeding in the third trimester?",
        options: ["Placenta previa", "Placental abruption", "Vasa previa", "Cervical ectropion"],
        correctAnswer: "Placenta previa",
        explanation: "Placenta previa presents with painless vaginal bleeding in the third trimester.",
        subject: "Pathology",
        system: "preg",
        difficulty: "Medium",
        status: "unseen",
      },
      {
        text: "A patient presents with sudden vision loss and sees 'floaters'. Fundoscopy shows a red reflex absent. What is the diagnosis?",
        options: ["Retinal detachment", "Vitreous hemorrhage", "Central retinal artery occlusion", "Optic neuritis"],
        correctAnswer: "Vitreous hemorrhage",
        explanation: "Vitreous hemorrhage presents with sudden vision loss, floaters, and absent red reflex on fundoscopy.",
        subject: "Pathology",
        system: "ophtho",
        difficulty: "Medium",
        status: "unseen",
      },
      {
        text: "A patient with diabetes has loss of red reflex and progressive vision loss. What complication is this?",
        options: ["Diabetic retinopathy", "Cataracts", "Glaucoma", "Macular degeneration"],
        correctAnswer: "Cataracts",
        explanation: "Loss of red reflex with progressive vision loss in a diabetic suggests cataracts.",
        subject: "Pathophysiology",
        system: "ophtho",
        difficulty: "Easy",
        status: "unseen",
      },
      {
        text: "A 30-year-old man presents with testicular mass that does not transilluminate. AFP and beta-hCG are elevated. What is the diagnosis?",
        options: ["Non-seminomatous germ cell tumor", "Seminoma", "Hydrocele", "Varicocele"],
        correctAnswer: "Non-seminomatous germ cell tumor",
        explanation: "Elevated AFP and beta-hCG indicate non-seminomatous germ cell tumor.",
        subject: "Pathology",
        system: "male-repro",
        difficulty: "Medium",
        status: "unseen",
      },
      {
        text: "What is the most common cause of male infertility?",
        options: ["Varicocele", "Cryptorchidism", "Hypogonadism", "Klinefelter syndrome"],
        correctAnswer: "Varicocele",
        explanation: "Varicocele is the most common correctable cause of male infertility.",
        subject: "Pathophysiology",
        system: "male-repro",
        difficulty: "Easy",
        status: "unseen",
      },
      {
        text: "A 28-year-old woman has regular 28-day cycles but has not conceived after 1 year. What is the next best step?",
        options: ["Confirm ovulation with basal body temperature", "Hysterosalpingography", "Laparoscopy", "IVF"],
        correctAnswer: "Confirm ovulation with basal body temperature",
        explanation: "First step in infertility workup is to confirm ovulation.",
        subject: "Pathophysiology",
        system: "female-repro",
        difficulty: "Medium",
        status: "unseen",
      },
      {
        text: "A woman presents with breast mass. Biopsy shows duct ectasia. What is the characteristic finding?",
        options: ["Dilated ducts with inflammatory cells", "Intraductal papilloma", "Fibroadenoma", "Invasive ductal carcinoma"],
        correctAnswer: "Dilated ducts with inflammatory cells",
        explanation: "Duct ectasia shows dilated ducts filled with inflammatory cells and debris.",
        subject: "Pathology",
        system: "female-repro",
        difficulty: "Easy",
        status: "unseen",
      },
      {
        text: "A patient with rheumatoid arthritis presents with dry eyes and dry mouth. What is the associated condition?",
        options: ["Sjögren syndrome", "Systemic lupus erythematosus", "Scleroderma", "Polymyositis"],
        correctAnswer: "Sjögren syndrome",
        explanation: "Sjögren syndrome commonly occurs secondary to RA and presents with sicca symptoms (dry eyes and mouth).",
        subject: "Pathology",
        system: "rheum",
        difficulty: "Easy",
        status: "unseen",
      },
      {
        text: "What is the most common organism causing septic arthritis in young, sexually active adults?",
        options: ["Neisseria gonorrhoeae", "Staphylococcus aureus", "Streptococcus pneumoniae", "Haemophilus influenzae"],
        correctAnswer: "Neisseria gonorrhoeae",
        explanation: "Neisseria gonorrhoeae is the most common cause of septic arthritis in sexually active young adults.",
        subject: "Microbiology",
        system: "rheum",
        difficulty: "Medium",
        status: "unseen",
      },
      {
        text: "A patient presents with acute onset severe abdominal pain, peritoneal signs, and free air under the diaphragm on X-ray. What is the diagnosis?",
        options: ["Perforated peptic ulcer", "Acute appendicitis", "Acute cholecystitis", "Diverticulitis"],
        correctAnswer: "Perforated peptic ulcer",
        explanation: "Free air under the diaphragm indicates hollow viscus perforation, most commonly perforated peptic ulcer.",
        subject: "Pathology",
        system: "gi",
        difficulty: "Easy",
        status: "unseen",
      },
      {
        text: "A patient with cirrhosis develops confusion and asterixis. Ammonia level is elevated. What is the diagnosis?",
        options: ["Hepatic encephalopathy", "Wernicke encephalopathy", "Delirium tremens", "Uremic encephalopathy"],
        correctAnswer: "Hepatic encephalopathy",
        explanation: "Hepatic encephalopathy in cirrhosis presents with confusion, asterixis, and elevated ammonia.",
        subject: "Pathophysiology",
        system: "gi",
        difficulty: "Easy",
        status: "unseen",
      },
      {
        text: "What is the mechanism of action of loop diuretics?",
        options: ["Inhibit Na-K-2Cl cotransporter", "Inhibit carbonic anhydrase", "Block aldosterone receptors", "Inhibit Na-Cl cotransporter"],
        correctAnswer: "Inhibit Na-K-2Cl cotransporter",
        explanation: "Loop diuretics inhibit the Na-K-2Cl cotransporter in the thick ascending limb of the loop of Henle.",
        subject: "Pharmacology",
        system: "renal",
        difficulty: "Easy",
        status: "unseen",
      },
      {
        text: "A patient presents with cola-colored urine, periorbital edema, and hypertension 2 weeks after pharyngitis. What is the diagnosis?",
        options: ["Post-streptococcal glomerulonephritis", "IgA nephropathy", "Minimal change disease", "Membranous nephropathy"],
        correctAnswer: "Post-streptococcal glomerulonephritis",
        explanation: "Post-streptococcal glomerulonephritis occurs 1-3 weeks after group A strep infection.",
        subject: "Pathology",
        system: "renal",
        difficulty: "Medium",
        status: "unseen",
      },
      {
        text: "What is the most common cause of bronchiolitis in infants?",
        options: ["Respiratory syncytial virus", "Influenza virus", "Parainfluenza virus", "Adenovirus"],
        correctAnswer: "Respiratory syncytial virus",
        explanation: "RSV is the most common cause of bronchiolitis in infants.",
        subject: "Microbiology",
        system: "pulm",
        difficulty: "Easy",
        status: "unseen",
      },
      {
        text: "A patient with COPD has increased anteroposterior chest diameter and hyperresonance to percussion. What is this called?",
        options: ["Barrel chest", "Pectus excavatum", "Pectus carinatum", "Kyphosis"],
        correctAnswer: "Barrel chest",
        explanation: "Barrel chest is characteristic of COPD due to air trapping and hyperinflation.",
        subject: "Pathophysiology",
        system: "pulm",
        difficulty: "Easy",
        status: "unseen",
      },
      {
        text: "A patient with a mechanical heart valve requires anticoagulation. What is the target INR?",
        options: ["2.5-3.5", "1.5-2.5", "3.5-4.5", "4.5-5.5"],
        correctAnswer: "2.5-3.5",
        explanation: "Mechanical heart valves require higher intensity anticoagulation with INR goal of 2.5-3.5.",
        subject: "Pharmacology",
        system: "cardio",
        difficulty: "Medium",
        status: "unseen",
      },
      {
        text: "A patient presents with exertional chest pain relieved by rest. ECG shows ST depression during exercise. What is the diagnosis?",
        options: ["Stable angina", "Unstable angina", "Myocardial infarction", "Pericarditis"],
        correctAnswer: "Stable angina",
        explanation: "Stable angina presents with predictable exertional chest pain relieved by rest.",
        subject: "Pathophysiology",
        system: "cardio",
        difficulty: "Easy",
        status: "unseen",
      },
      {
        text: "What type of hypersensitivity reaction is anaphylaxis?",
        options: ["Type I", "Type II", "Type III", "Type IV"],
        correctAnswer: "Type I",
        explanation: "Anaphylaxis is a Type I (IgE-mediated) hypersensitivity reaction.",
        subject: "Immunology",
        system: "allergy",
        difficulty: "Easy",
        status: "unseen",
      },
      {
        text: "A patient with peanut allergy carries an epinephrine auto-injector. What is the mechanism of action?",
        options: ["Alpha and beta adrenergic agonist", "Antihistamine", "Corticosteroid", "Leukotriene inhibitor"],
        correctAnswer: "Alpha and beta adrenergic agonist",
        explanation: "Epinephrine is a non-selective alpha and beta adrenergic agonist used for anaphylaxis.",
        subject: "Pharmacology",
        system: "allergy",
        difficulty: "Easy",
        status: "unseen",
      },
      {
        text: "A patient presents with tremor, rigidity, and bradykinesia. What neurotransmitter is deficient?",
        options: ["Dopamine", "Serotonin", "Acetylcholine", "GABA"],
        correctAnswer: "Dopamine",
        explanation: "Parkinson's disease is characterized by dopamine deficiency in the substantia nigra.",
        subject: "Pathophysiology",
        system: "neuro",
        difficulty: "Easy",
        status: "unseen",
      },
      {
        text: "What is the first-line treatment for absence seizures in children?",
        options: ["Ethosuximide", "Phenytoin", "Carbamazepine", "Lamotrigine"],
        correctAnswer: "Ethosuximide",
        explanation: "Ethosuximide is the first-line treatment for absence (petit mal) seizures in children.",
        subject: "Pharmacology",
        system: "neuro",
        difficulty: "Medium",
        status: "unseen",
      },
      {
        text: "What is the most common cause of acute pancreatitis?",
        options: ["Gallstones", "Alcohol", "Hypertriglyceridemia", "Trauma"],
        correctAnswer: "Gallstones",
        explanation: "Gallstones are the most common cause of acute pancreatitis, followed by alcohol.",
        subject: "Pathology",
        system: "gi",
        difficulty: "Easy",
        status: "unseen",
      },
      {
        text: "A patient with sickle cell disease presents with sudden severe anemia and reticulocytopenia. What is the cause?",
        options: ["Parvovirus B19 infection", "Splenic sequestration", "Hemolytic crisis", "Vaso-occlusive crisis"],
        correctAnswer: "Parvovirus B19 infection",
        explanation: "Parvovirus B19 causes aplastic crisis in sickle cell disease patients.",
        subject: "Microbiology",
        system: "heme-onc",
        difficulty: "Medium",
        status: "unseen",
      },
      {
        text: "What is the most common type of kidney stone?",
        options: ["Calcium oxalate", "Uric acid", "Struvite", "Cystine"],
        correctAnswer: "Calcium oxalate",
        explanation: "Calcium oxalate stones are the most common type of kidney stones.",
        subject: "Pathology",
        system: "renal",
        difficulty: "Easy",
        status: "unseen",
      },
      {
        text: "A patient on warfarin has INR of 8 with no bleeding. What is the appropriate management?",
        options: ["Hold warfarin and give vitamin K PO", "Continue warfarin", "Give FFP", "Give prothrombin complex concentrate"],
        correctAnswer: "Hold warfarin and give vitamin K PO",
        explanation: "For elevated INR without bleeding, hold warfarin and give oral vitamin K.",
        subject: "Pharmacology",
        system: "heme-onc",
        difficulty: "Medium",
        status: "unseen",
      },
      {
        text: "What is the mechanism of action of selective serotonin reuptake inhibitors (SSRIs)?",
        options: ["Block serotonin reuptake", "Block MAO-A", "Block serotonin receptors", "Increase serotonin synthesis"],
        correctAnswer: "Block serotonin reuptake",
        explanation: "SSRIs block the reuptake of serotonin, increasing its concentration in the synaptic cleft.",
        subject: "Pharmacology",
        system: "psych",
        difficulty: "Easy",
        status: "unseen",
      },
      {
        text: "A patient presents with dermatitis, diarrhea, and dementia. What vitamin deficiency is this?",
        options: ["Niacin (B3)", "Thiamine (B1)", "Cobalamin (B12)", "Pyridoxine (B6)"],
        correctAnswer: "Niacin (B3)",
        explanation: "Pellagra (niacin deficiency) presents with the 3 Ds: Dermatitis, Diarrhea, Dementia.",
        subject: "Biochemistry",
        system: "biochem-general",
        difficulty: "Medium",
        status: "unseen",
      },
      {
        text: "What is the rate-limiting enzyme of glycolysis?",
        options: ["Phosphofructokinase-1", "Hexokinase", "Pyruvate kinase", "Aldolase"],
        correctAnswer: "Phosphofructokinase-1",
        explanation: "Phosphofructokinase-1 is the rate-limiting enzyme of glycolysis.",
        subject: "Biochemistry",
        system: "biochem-general",
        difficulty: "Easy",
        status: "unseen",
      },
      {
        text: "A patient's lab shows microcytic anemia with high RDW. What is the most likely diagnosis?",
        options: ["Iron deficiency anemia", "Thalassemia", "Anemia of chronic disease", "Sideroblastic anemia"],
        correctAnswer: "Iron deficiency anemia",
        explanation: "Iron deficiency anemia causes microcytic anemia with high RDW (red cell distribution width).",
        subject: "Pathology",
        system: "heme-onc",
        difficulty: "Medium",
        status: "unseen",
      },
      {
        text: "What type of epithelium lines the respiratory tract?",
        options: ["Pseudostratified columnar ciliated", "Simple squamous", "Stratified squamous", "Simple cuboidal"],
        correctAnswer: "Pseudostratified columnar ciliated",
        explanation: "The respiratory tract is lined by pseudostratified columnar ciliated epithelium with goblet cells.",
        subject: "Histology",
        system: "pulm",
        difficulty: "Easy",
        status: "unseen",
      },
      {
        text: "What is the primary muscle of inspiration?",
        options: ["Diaphragm", "External intercostals", "Sternocleidomastoid", "Scalenes"],
        correctAnswer: "Diaphragm",
        explanation: "The diaphragm is the primary muscle of inspiration.",
        subject: "Anatomy",
        system: "pulm",
        difficulty: "Easy",
        status: "unseen",
      },
      {
        text: "A patient with depression is not responding to SSRIs. Which class of antidepressants should be tried next?",
        options: ["SNRI", "MAOI", "Tricyclic antidepressants", "Atypical antipsychotics"],
        correctAnswer: "SNRI",
        explanation: "SNRIs (serotonin-norepinephrine reuptake inhibitors) are typically tried after SSRI failure.",
        subject: "Pharmacology",
        system: "psych",
        difficulty: "Medium",
        status: "unseen",
      },
      {
        text: "What is the inheritance pattern of Duchenne muscular dystrophy?",
        options: ["X-linked recessive", "Autosomal recessive", "Autosomal dominant", "X-linked dominant"],
        correctAnswer: "X-linked recessive",
        explanation: "Duchenne muscular dystrophy is an X-linked recessive disorder affecting the dystrophin gene.",
        subject: "Genetics",
        system: "genetics-general",
        difficulty: "Easy",
        status: "unseen",
      },
      {
        text: "A child presents with 'strawberry tongue' and desquamating rash after fever. What is the diagnosis?",
        options: ["Scarlet fever", "Kawasaki disease", "Measles", "Rubella"],
        correctAnswer: "Scarlet fever",
        explanation: "Scarlet fever (group A strep) presents with strawberry tongue and sandpaper-like desquamating rash.",
        subject: "Microbiology",
        system: "infectious",
        difficulty: "Medium",
        status: "unseen",
      },
      {
        text: "What layer of the heart is affected in rheumatic fever?",
        options: ["All three layers (pancarditis)", "Endocardium only", "Myocardium only", "Pericardium only"],
        correctAnswer: "All three layers (pancarditis)",
        explanation: "Rheumatic fever causes pancarditis affecting endocardium, myocardium, and pericardium.",
        subject: "Pathology",
        system: "cardio",
        difficulty: "Medium",
        status: "unseen",
      },
      {
        text: "A newborn has a continuous machine-like murmur. What is the diagnosis?",
        options: ["Patent ductus arteriosus", "Ventricular septal defect", "Atrial septal defect", "Tetralogy of Fallot"],
        correctAnswer: "Patent ductus arteriosus",
        explanation: "Patent ductus arteriosus causes a continuous 'machinery' murmur.",
        subject: "Pathology",
        system: "cardio",
        difficulty: "Easy",
        status: "unseen",
      },
      {
        text: "What is the gold standard for diagnosing pulmonary embolism?",
        options: ["CT pulmonary angiography", "V/Q scan", "D-dimer", "Chest X-ray"],
        correctAnswer: "CT pulmonary angiography",
        explanation: "CT pulmonary angiography (CTPA) is the gold standard for diagnosing pulmonary embolism.",
        subject: "Pathology",
        system: "pulm",
        difficulty: "Easy",
        status: "unseen",
      },
      {
        text: "A patient has bitemporal hemianopsia. Where is the lesion?",
        options: ["Optic chiasm", "Optic nerve", "Optic tract", "Occipital cortex"],
        correctAnswer: "Optic chiasm",
        explanation: "Bitemporal hemianopsia is caused by a lesion at the optic chiasm (typically pituitary adenoma).",
        subject: "Anatomy",
        system: "neuro",
        difficulty: "Medium",
        status: "unseen",
      },
      {
        text: "What is the most common cause of sudden cardiac death in young athletes?",
        options: ["Hypertrophic cardiomyopathy", "Coronary artery disease", "Long QT syndrome", "Arrhythmogenic right ventricular cardiomyopathy"],
        correctAnswer: "Hypertrophic cardiomyopathy",
        explanation: "Hypertrophic cardiomyopathy is the most common cause of sudden cardiac death in young athletes.",
        subject: "Pathology",
        system: "cardio",
        difficulty: "Medium",
        status: "unseen",
      },
      {
        text: "A woman presents with pain during intercourse and vaginal discharge. Wet mount shows clue cells. What is the diagnosis?",
        options: ["Bacterial vaginosis", "Trichomonas vaginitis", "Candida vaginitis", "Chlamydia cervicitis"],
        correctAnswer: "Bacterial vaginosis",
        explanation: "Clue cells on wet mount are diagnostic of bacterial vaginosis (Gardnerella vaginalis).",
        subject: "Microbiology",
        system: "female-repro",
        difficulty: "Easy",
        status: "unseen",
      },
    ];

    sampleQuestions.forEach(q => {
      const id = randomUUID();
      this.questions.set(id, { ...q, id });
    });

    // Seed sample study tasks
    const sampleTasks: InsertStudyTask[] = [
      {
        title: "Review Cardiovascular Pharmacology",
        type: "Study Session",
        duration: "2 hrs",
        status: "upcoming",
        dueDate: new Date(Date.now() + 86400000).toISOString(),
      },
      {
        title: "Complete Practice Test",
        type: "Practice Test",
        duration: "1 hr",
        status: "overdue",
        dueDate: new Date(Date.now() - 86400000).toISOString(),
      },
    ];

    sampleTasks.forEach(t => {
      const id = randomUUID();
      this.studyTasks.set(id, { ...t, id });
    });

    // Seed sample articles
    const sampleArticles: InsertArticle[] = [
      {
        title: "Cardiac Physiology: Understanding the Heart Cycle",
        category: "Cardiovascular",
        type: "article",
        description: "Comprehensive guide to cardiac cycle phases, electrical conduction, and hemodynamics.",
        readTime: "15 min read",
      },
      {
        title: "ECG Interpretation Masterclass",
        category: "Cardiology",
        type: "video",
        description: "Step-by-step video guide to reading and interpreting electrocardiograms.",
        videoLength: "45 min",
      },
    ];

    sampleArticles.forEach(a => {
      const id = randomUUID();
      this.articles.set(id, { ...a, id });
    });
  }

  // Questions
  async getQuestions(): Promise<Question[]> {
    return Array.from(this.questions.values());
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    return this.questions.get(id);
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = randomUUID();
    const question: Question = { ...insertQuestion, id };
    this.questions.set(id, question);
    return question;
  }

  async searchQuestions(filters: {
    subject?: string;
    system?: string;
    status?: string;
    searchTerm?: string;
  }): Promise<Question[]> {
    let questions = Array.from(this.questions.values());

    if (filters.subject && filters.subject !== "all") {
      questions = questions.filter(q => q.subject === filters.subject);
    }

    if (filters.system && filters.system !== "all") {
      questions = questions.filter(q => q.system === filters.system);
    }

    if (filters.status && filters.status !== "all") {
      questions = questions.filter(q => q.status === filters.status);
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      questions = questions.filter(q =>
        q.text.toLowerCase().includes(term) ||
        q.id.toLowerCase().includes(term)
      );
    }

    return questions;
  }

  // Tests
  async getTests(): Promise<Test[]> {
    return Array.from(this.tests.values());
  }

  async getTest(id: string): Promise<Test | undefined> {
    return this.tests.get(id);
  }

  async createTest(insertTest: InsertTest): Promise<Test> {
    const id = randomUUID();
    
    // Fetch questions matching ANY of the selected subjects OR systems
    let allQuestions = Array.from(this.questions.values());
    
    // Filter by subjects OR systems (if either is specified)
    if (insertTest.subjects.length > 0 || insertTest.systems.length > 0) {
      allQuestions = allQuestions.filter(q => {
        const matchesSubject = insertTest.subjects.length === 0 || insertTest.subjects.includes(q.subject);
        const matchesSystem = insertTest.systems.length === 0 || insertTest.systems.includes(q.system);
        // Question matches if it matches ANY selected subject OR ANY selected system
        return matchesSubject || matchesSystem;
      });
    }
    
    // Check if we have enough questions
    if (allQuestions.length === 0) {
      throw new Error("No questions found matching the selected subjects or systems. Please adjust your filters.");
    }
    
    if (allQuestions.length < insertTest.questionCount) {
      throw new Error(`Only ${allQuestions.length} question(s) available for the selected filters. Please reduce the question count or adjust your filters.`);
    }
    
    // Limit to requested count
    const questionsToUse = allQuestions.slice(0, insertTest.questionCount);
    const questionIds = questionsToUse.map(q => q.id);
    
    const test: Test = {
      ...insertTest,
      id,
      questions: questionIds,
      createdAt: new Date().toISOString(),
    };
    this.tests.set(id, test);
    return test;
  }

  async updateTest(id: string, updates: Partial<Test>): Promise<Test | undefined> {
    const test = this.tests.get(id);
    if (!test) return undefined;
    
    const updatedTest = { ...test, ...updates };
    this.tests.set(id, updatedTest);
    return updatedTest;
  }

  async deleteTest(id: string): Promise<boolean> {
    return this.tests.delete(id);
  }

  // Flashcard Decks
  async getFlashcardDecks(): Promise<FlashcardDeck[]> {
    return Array.from(this.flashcardDecks.values());
  }

  async getFlashcardDeck(id: string): Promise<FlashcardDeck | undefined> {
    return this.flashcardDecks.get(id);
  }

  async createFlashcardDeck(insertDeck: InsertFlashcardDeck): Promise<FlashcardDeck> {
    const id = randomUUID();
    const deck: FlashcardDeck = {
      ...insertDeck,
      id,
      createdAt: new Date().toISOString(),
    };
    this.flashcardDecks.set(id, deck);
    return deck;
  }

  async updateFlashcardDeck(id: string, updates: Partial<FlashcardDeck>): Promise<FlashcardDeck | undefined> {
    const deck = this.flashcardDecks.get(id);
    if (!deck) return undefined;
    
    const updatedDeck = { ...deck, ...updates };
    this.flashcardDecks.set(id, updatedDeck);
    return updatedDeck;
  }

  async deleteFlashcardDeck(id: string): Promise<boolean> {
    // Also delete all flashcards in this deck
    const flashcards = Array.from(this.flashcards.values()).filter(f => f.deckId === id);
    flashcards.forEach(f => this.flashcards.delete(f.id));
    return this.flashcardDecks.delete(id);
  }

  // Flashcards
  async getFlashcards(deckId: string): Promise<Flashcard[]> {
    return Array.from(this.flashcards.values()).filter(f => f.deckId === deckId);
  }

  async getFlashcard(id: string): Promise<Flashcard | undefined> {
    return this.flashcards.get(id);
  }

  async createFlashcard(insertFlashcard: InsertFlashcard): Promise<Flashcard> {
    const id = randomUUID();
    const flashcard: Flashcard = { ...insertFlashcard, id };
    this.flashcards.set(id, flashcard);
    return flashcard;
  }

  async updateFlashcard(id: string, updates: Partial<Flashcard>): Promise<Flashcard | undefined> {
    const flashcard = this.flashcards.get(id);
    if (!flashcard) return undefined;
    
    const updatedFlashcard = { ...flashcard, ...updates };
    this.flashcards.set(id, updatedFlashcard);
    return updatedFlashcard;
  }

  async deleteFlashcard(id: string): Promise<boolean> {
    return this.flashcards.delete(id);
  }

  // Notes
  async getNotes(): Promise<Note[]> {
    return Array.from(this.notes.values());
  }

  async getNote(id: string): Promise<Note | undefined> {
    return this.notes.get(id);
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const note: Note = {
      ...insertNote,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.notes.set(id, note);
    return note;
  }

  async updateNote(id: string, updates: Partial<Note>): Promise<Note | undefined> {
    const note = this.notes.get(id);
    if (!note) return undefined;
    
    const updatedNote = {
      ...note,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.notes.set(id, updatedNote);
    return updatedNote;
  }

  async deleteNote(id: string): Promise<boolean> {
    return this.notes.delete(id);
  }

  // Study Tasks
  async getStudyTasks(): Promise<StudyTask[]> {
    return Array.from(this.studyTasks.values());
  }

  async getStudyTask(id: string): Promise<StudyTask | undefined> {
    return this.studyTasks.get(id);
  }

  async createStudyTask(insertTask: InsertStudyTask): Promise<StudyTask> {
    const id = randomUUID();
    const task: StudyTask = { ...insertTask, id };
    this.studyTasks.set(id, task);
    return task;
  }

  async updateStudyTask(id: string, updates: Partial<StudyTask>): Promise<StudyTask | undefined> {
    const task = this.studyTasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { ...task, ...updates };
    this.studyTasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteStudyTask(id: string): Promise<boolean> {
    return this.studyTasks.delete(id);
  }

  // Articles
  async getArticles(): Promise<Article[]> {
    return Array.from(this.articles.values());
  }

  async getArticle(id: string): Promise<Article | undefined> {
    return this.articles.get(id);
  }

  async searchArticles(filters: { searchTerm?: string; type?: string }): Promise<Article[]> {
    let articles = Array.from(this.articles.values());

    if (filters.type && filters.type !== "all") {
      articles = articles.filter(a => a.type === filters.type);
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      articles = articles.filter(a =>
        a.title.toLowerCase().includes(term) ||
        a.category.toLowerCase().includes(term)
      );
    }

    return articles;
  }
}

export const storage = new MemStorage();
