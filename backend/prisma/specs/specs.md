Study the schema in backend folder.

I want to enhance it for an LMS system. Roles are (Admin, Student, InstituionManager)

- Product: USMLE, SAT, ...
- ProductTag: (Anatomy, Biochemistry, Embryology, etc)

- Our Actual Service Definition (for a Product)
  - Section: General Principles, Clinical Sciences, Organ Systems
  - Chapter: (Biochemistry, Microbiology)
  - Topic: (Lipid metabolism, Miscellaneous, etc)
  - Questions: The multiple choice questions
  - QuestionChoices

- Service Provision
  - QuestionPaper: Collection of Questions
  - QuestionPaperQuestion: Has question as well as provision to store answer

- Billing
  - ProductSubtype: (Qbank, Self-Assessment, Biostatics Rerview)
  - PackageFeatures
  - SubscriptionPackage
    - has n days validity
  - SubscriptionFeatures (Qbank, 1 self Assessment, One Time Reset, Study Planner, )
  - Subscription

- Product - Section -> 1:n
- Section - Chapter -> 1:n
- Chapter - Topic -> 1:n
- Topic - Question -> 1:n
- Question - QuestionChoices -> 1:n

- QuestionPaper - QuestionPaperQuestion -> 1:n
- Question - QuestionPaperQuestion -> 1:n
- User - QuestionPaper -> 1:n
- Product - ProductTag -> 1:n
- ProductTag - Question -> 1:n
- Product - ProductSubtype -> 1:n
- ProductSubtype - SubscriptionPackage -> 1:n
- SubscriptionPackage - SubscriptionFeatures -> 1:n
- PackageFeatures - SubscriptionFeatures -> 1:n
- SubscriptionPackage - Subscription -> 1:n
- User - Subscription -> 1:n

# Roles:

- Admin
  - Make Question
- Student
  - Subscribe a product for a duration
  - Make QuestionPaper
    - Question Paper has Questions
    -
    - It has ability to answer and keep record
- ## InstitutionManager
  - Make StudyPlan
    - Just a template (how many questions per day)
    - for measuring progress

# Institution Module

will have intitution table

# Subject Module: (subject-product.prisma). Prefix SP

- On one extreme, we will have Subject table (Anatomy, Physilology, Mechanics, etc).
- We will have Product table (USMLE1, SAT, GRE, etc). We will also have a many to many SubjectProduct table.
- Then we will have 3 levels of depth, SubjectLevel1 (General Principles, Clinical Sciences, etc).
- The there will be SubjectLevel2 (Biochemistry, Genetics, etc),
- then there will be SubjectLevel3 (Lipid metabolism, Bacteriology, etc).
- Each Product will have specific level (1,2,3).

# MCQ Module: (multiple-choice-question.prisma). Prefix MQ

- On other extreme, there there will be Question and related info, eg, Answers to questions.
- Each table in this category will have MC prefix. Each question will have info wrt which Subject, Level

# Question Paper Module: (question-paper.prisma) prefix QP

It will contain QuestionPaper and related tables to create a question paper for a subject. A student can prepare a QuestionPaper for himself. the answers and explanation for each answer will be stored. Additional information will also be stored, can be tables, images, etc. or hyperlinks to relevant course content.

# Answer Sheet Module:

- For a particular question paper we can have answer sheets.

# Study Plan (study-plan.prisma) prefix SP

- It will have pre-made plans for different subjects. Each study plan will have a duration in days.
- Study plan is a set of questions papers

# Student Study Plan: ()

Subscription Module: (subscription.prisma)

- User or Institutions can subscribe to products with validities.

# Subjects

- Anatomy
- Behavioral science
- Biochemistry
- Biostatistics
- Embryology
- Genetics
- Histology
- Immunology
- Microbiology
- Pathology
- Pathophysiology
- Pharmacology
- Physiology

---

# Systems

## General Principles

### Biochemistry

- Amino acids, proteins, and enzymes
- Bioenergetics and carbohydrate metabolism
- Cell and molecular biology
- Lipid metabolism
- Miscellaneous

### Genetics

- Clinical genetics
- DNA structure, replication, and repair
- Gene expression and regulation
- Protein synthesis
- RNA structure, synthesis, and processing
- Miscellaneous

### Microbiology

- Bacteriology
- Mycology
- Parasitology
- Virology
- Miscellaneous

### Pathology

- Cellular pathology
- Inflammation and repair
- Neoplasia

### Pharmacology

- Drug metabolism and toxicity
- Drug receptors and pharmacodynamics
- Pharmacokinetics
- Miscellaneous

## Clinical Sciences

### Biostatistics & Epidemiology

- Epidemiology and population health
- Measures and distribution of data
- Probability and principles of testing
- Study design and interpretation
- Miscellaneous

### Poisoning & Environmental Exposure

- Environmental exposure
- Toxicology

---

### Psychiatric / Behavioral & Substance Use Disorder

- Normal behavior and development
- Anxiety and trauma-related disorders
- Mood disorders
- Neurodevelopmental disorders
- Personality disorders
- Psychotic disorders
- Substance use disorders
- Eating disorders
- Somatoform disorders
- Miscellaneous

---

### Social Sciences (Ethics / Legal / Professional)

- Communication and interpersonal skills
- Healthcare policy and economics
- Medical ethics and jurisprudence
- Patient safety
- System-based practice and quality improvement
- Miscellaneous

---

### Miscellaneous (Multisystem)

- Miscellaneous

---

## Organ Systems

### Allergy & Immunology

- Anaphylaxis and allergic reactions
- Autoimmune diseases
- Immune deficiencies
- Transplant medicine
- Principles of immunology
- Miscellaneous

---

### Cardiovascular System

- Normal structure and function of the cardiovascular system
- Aortic and peripheral artery diseases
- Cardiac arrhythmias
- Congenital heart disease
- Coronary heart disease
- Heart failure and shock
- Hypertension
- Myopericardial diseases
- Valvular heart diseases
- Cardiovascular drugs
- Miscellaneous

---

### Dermatology

- Normal structure and function of skin
- Disorders of epidermal appendages
- Inflammatory dermatoses and bullous diseases
- Skin and soft tissue infections
- Skin tumors and tumor-like lesions
- Miscellaneous

---

### Ear, Nose & Throat (ENT)

- Disorders of the ear, nose, and throat

---

### Endocrine, Diabetes & Metabolism

- Normal structure and function of endocrine glands
- Congenital and developmental anomalies
- Adrenal disorders
- Diabetes mellitus
- Endocrine tumors
- Hypothalamus and pituitary disorders
- Obesity and dyslipidemia
- Reproductive endocrinology
- Thyroid disorders
- Miscellaneous

---

### Female Reproductive System & Breast

- Normal structure and function of the female reproductive system and breast
- Congenital and developmental anomalies
- Breast disorders
- Genital tract tumors and tumor-like lesions
- Genitourinary tract infections
- Menstrual disorders and contraception
- Miscellaneous

---

### Gastrointestinal & Nutrition

- Normal structure and function of the GI tract
- Congenital and developmental anomalies
- Biliary tract disorders
- Disorders of nutrition
- Gastroesophageal disorders
- Hepatic disorders
- Intestinal and colorectal disorders
- Pancreatic disorders
- Tumors of the GI tract
- Miscellaneous

---

### Hematology & Oncology

- Normal hematologic structure and function
- Hemostasis and thrombosis
- Plasma cell disorders
- Platelet disorders
- Red blood cell disorders
- Transfusion medicine
- White blood cell disorders
- Principles of oncology
- Miscellaneous

---

### Infectious Diseases

- Antimicrobial drugs
- Bacterial infections
- Fungal infections
- HIV and sexually transmitted infections
- Infection control
- Parasitic and helminthic infections
- Viral infections
- Miscellaneous

---

### Male Reproductive System

- Normal structure and function of the male reproductive system
- Disorders of the male reproductive system

---

### Nervous System

- Normal structure and function of the nervous system
- Congenital and developmental anomalies
- Cerebrovascular disease
- CNS infections
- Demyelinating diseases
- Disorders of peripheral nerves and muscles
- Headache
- Neurodegenerative disorders and dementias
- Seizures and epilepsy
- Spinal cord disorders
- Traumatic brain injuries
- Tumors of the nervous system
- Hydrocephalus
- Anesthesia
- Sleep disorders
- Miscellaneous

---

### Ophthalmology

- Normal structure and function of the eye and associated structures
- Disorders of the eye and associated structures

---

### Pregnancy, Childbirth & Puerperium

- Normal pregnancy, childbirth, and puerperium
- Disorders of pregnancy, childbirth, and puerperium

---

### Pulmonary & Critical Care

- Normal pulmonary structure and function
- Congenital and developmental anomalies
- Critical care medicine
- Interstitial lung disease
- Lung cancer
- Obstructive lung disease
- Pulmonary infections
- Pulmonary vascular disease
- Sleep disorders
- Miscellaneous

---

### Renal, Urinary Systems & Electrolytes

- Normal structure and function of the kidneys and urinary system
- Congenital and developmental anomalies
- Acute kidney injury
- Bone metabolism
- Chronic kidney disease
- Cystic kidney diseases
- Fluid, electrolytes, and acid-base
- Glomerular diseases
- Neoplasms of the kidneys and urinary tract
- Nephrolithiasis and urinary tract obstruction
- Diabetes insipidus
- Urinary incontinence
- Miscellaneous

---

### Rheumatology / Orthopedics & Sports

- Normal structure and function of the musculoskeletal system
- Congenital and developmental anomalies
- Arthritis and spondyloarthropathies
- Autoimmune disorders and vasculitides
- Bone/joint injuries and infections
- Bone tumors and tumor-like lesions
- Spinal disorders and back pain
- Metabolic bone disorders
- Miscellaneous

---------------------=============
