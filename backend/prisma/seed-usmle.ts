import { PrismaClient } from "@prisma/client";

export async function seedUSMLE(prisma: PrismaClient) {
  console.log("🏥 Starting USMLE database seeding...");

  // Create USMLE Product
  console.log("📚 Creating USMLE Step 1 product...");
  const usmleProduct = await prisma.product.upsert({
    where: { name: "USMLE Step 1" },
    update: {},
    create: {
      name: "USMLE Step 1",
      description:
        "United States Medical Licensing Examination Step 1 - Comprehensive question bank and learning materials",
      isActive: true,
    },
  });

  // Create Product Tags
  console.log("🏷️  Creating product tags...");
  const tagNames = [
    "Anatomy",
    "Behavioral science",
    "Biochemistry",
    "Biostatistics",
    "Embryology",
    "Genetics",
    "Histology",
    "Immunology",
    "Microbiology",
    "Pathology",
    "Pathophysiology",
    "Pharmacology",
    "Physiology",
  ];

  const tags: Record<string, any> = {};
  for (const tagName of tagNames) {
    const tag = await prisma.productTag.upsert({
      where: { name: tagName },
      update: {},
      create: {
        name: tagName,
        description: `${tagName} related questions`,
        isActive: true,
      },
    });
    tags[tagName] = tag;
  }

  // Link tags to product
  console.log("🔗 Linking tags to product...");
  await prisma.product.update({
    where: { id: usmleProduct.id },
    data: {
      productTags: {
        connect: Object.values(tags).map((tag) => ({ id: tag.id })),
      },
    },
  });

  // Create Sections with Chapters and Topics
  console.log("📖 Creating sections, chapters, and topics...");

  // ========== GENERAL PRINCIPLES SECTION ==========
  const generalPrinciplesSection = await prisma.section.upsert({
    where: {
      productId_name: {
        productId: usmleProduct.id,
        name: "General Principles",
      },
    },
    update: {},
    create: {
      productId: usmleProduct.id,
      name: "General Principles",
      description: "Foundational principles in medical sciences",
      order: 1,
      isActive: true,
    },
  });

  // Biochemistry Chapter
  const biochemistryChapter = await prisma.chapter.upsert({
    where: {
      sectionId_name: {
        sectionId: generalPrinciplesSection.id,
        name: "Biochemistry",
      },
    },
    update: {},
    create: {
      sectionId: generalPrinciplesSection.id,
      name: "Biochemistry",
      order: 1,
      isActive: true,
    },
  });

  const biochemistryTopics = [
    "Amino acids, proteins, and enzymes",
    "Bioenergetics and carbohydrate metabolism",
    "Cell and molecular biology",
    "Lipid metabolism",
    "Miscellaneous",
  ];

  for (let i = 0; i < biochemistryTopics.length; i++) {
    await prisma.topic.upsert({
      where: {
        chapterId_name: {
          chapterId: biochemistryChapter.id,
          name: biochemistryTopics[i],
        },
      },
      update: {},
      create: {
        chapterId: biochemistryChapter.id,
        name: biochemistryTopics[i],
        order: i + 1,
        isActive: true,
      },
    });
  }

  // Genetics Chapter
  const geneticsChapter = await prisma.chapter.upsert({
    where: {
      sectionId_name: {
        sectionId: generalPrinciplesSection.id,
        name: "Genetics",
      },
    },
    update: {},
    create: {
      sectionId: generalPrinciplesSection.id,
      name: "Genetics",
      order: 2,
      isActive: true,
    },
  });

  const geneticsTopics = [
    "Clinical genetics",
    "DNA structure, replication, and repair",
    "Gene expression and regulation",
    "Protein synthesis",
    "RNA structure, synthesis, and processing",
    "Miscellaneous",
  ];

  for (let i = 0; i < geneticsTopics.length; i++) {
    await prisma.topic.upsert({
      where: {
        chapterId_name: {
          chapterId: geneticsChapter.id,
          name: geneticsTopics[i],
        },
      },
      update: {},
      create: {
        chapterId: geneticsChapter.id,
        name: geneticsTopics[i],
        order: i + 1,
        isActive: true,
      },
    });
  }

  // Microbiology Chapter
  const microbiologyChapter = await prisma.chapter.upsert({
    where: {
      sectionId_name: {
        sectionId: generalPrinciplesSection.id,
        name: "Microbiology",
      },
    },
    update: {},
    create: {
      sectionId: generalPrinciplesSection.id,
      name: "Microbiology",
      order: 3,
      isActive: true,
    },
  });

  const microbiologyTopics = [
    "Bacteriology",
    "Mycology",
    "Parasitology",
    "Virology",
    "Miscellaneous",
  ];

  for (let i = 0; i < microbiologyTopics.length; i++) {
    await prisma.topic.upsert({
      where: {
        chapterId_name: {
          chapterId: microbiologyChapter.id,
          name: microbiologyTopics[i],
        },
      },
      update: {},
      create: {
        chapterId: microbiologyChapter.id,
        name: microbiologyTopics[i],
        order: i + 1,
        isActive: true,
      },
    });
  }

  // Pathology Chapter
  const pathologyChapter = await prisma.chapter.upsert({
    where: {
      sectionId_name: {
        sectionId: generalPrinciplesSection.id,
        name: "Pathology",
      },
    },
    update: {},
    create: {
      sectionId: generalPrinciplesSection.id,
      name: "Pathology",
      order: 4,
      isActive: true,
    },
  });

  const pathologyTopics = [
    "Cellular pathology",
    "Inflammation and repair",
    "Neoplasia",
  ];

  for (let i = 0; i < pathologyTopics.length; i++) {
    await prisma.topic.upsert({
      where: {
        chapterId_name: {
          chapterId: pathologyChapter.id,
          name: pathologyTopics[i],
        },
      },
      update: {},
      create: {
        chapterId: pathologyChapter.id,
        name: pathologyTopics[i],
        order: i + 1,
        isActive: true,
      },
    });
  }

  // Pharmacology Chapter
  const pharmacologyChapter = await prisma.chapter.upsert({
    where: {
      sectionId_name: {
        sectionId: generalPrinciplesSection.id,
        name: "Pharmacology",
      },
    },
    update: {},
    create: {
      sectionId: generalPrinciplesSection.id,
      name: "Pharmacology",
      order: 5,
      isActive: true,
    },
  });

  const pharmacologyTopics = [
    "Drug metabolism and toxicity",
    "Drug receptors and pharmacodynamics",
    "Pharmacokinetics",
    "Miscellaneous",
  ];

  for (let i = 0; i < pharmacologyTopics.length; i++) {
    await prisma.topic.upsert({
      where: {
        chapterId_name: {
          chapterId: pharmacologyChapter.id,
          name: pharmacologyTopics[i],
        },
      },
      update: {},
      create: {
        chapterId: pharmacologyChapter.id,
        name: pharmacologyTopics[i],
        order: i + 1,
        isActive: true,
      },
    });
  }

  // ========== CLINICAL SCIENCES SECTION ==========
  const clinicalSciencesSection = await prisma.section.upsert({
    where: {
      productId_name: { productId: usmleProduct.id, name: "Clinical Sciences" },
    },
    update: {},
    create: {
      productId: usmleProduct.id,
      name: "Clinical Sciences",
      description: "Clinical sciences and research methods",
      order: 2,
      isActive: true,
    },
  });

  // Biostatistics & Epidemiology Chapter
  const biostatChapter = await prisma.chapter.upsert({
    where: {
      sectionId_name: {
        sectionId: clinicalSciencesSection.id,
        name: "Biostatistics & Epidemiology",
      },
    },
    update: {},
    create: {
      sectionId: clinicalSciencesSection.id,
      name: "Biostatistics & Epidemiology",
      order: 1,
      isActive: true,
    },
  });

  const biostatTopics = [
    "Epidemiology and population health",
    "Measures and distribution of data",
    "Probability and principles of testing",
    "Study design and interpretation",
    "Miscellaneous",
  ];

  for (let i = 0; i < biostatTopics.length; i++) {
    await prisma.topic.upsert({
      where: {
        chapterId_name: {
          chapterId: biostatChapter.id,
          name: biostatTopics[i],
        },
      },
      update: {},
      create: {
        chapterId: biostatChapter.id,
        name: biostatTopics[i],
        order: i + 1,
        isActive: true,
      },
    });
  }

  // Poisoning & Environmental Exposure Chapter
  const poisoningChapter = await prisma.chapter.upsert({
    where: {
      sectionId_name: {
        sectionId: clinicalSciencesSection.id,
        name: "Poisoning & Environmental Exposure",
      },
    },
    update: {},
    create: {
      sectionId: clinicalSciencesSection.id,
      name: "Poisoning & Environmental Exposure",
      order: 2,
      isActive: true,
    },
  });

  const poisoningTopics = ["Environmental exposure", "Toxicology"];

  for (let i = 0; i < poisoningTopics.length; i++) {
    await prisma.topic.upsert({
      where: {
        chapterId_name: {
          chapterId: poisoningChapter.id,
          name: poisoningTopics[i],
        },
      },
      update: {},
      create: {
        chapterId: poisoningChapter.id,
        name: poisoningTopics[i],
        order: i + 1,
        isActive: true,
      },
    });
  }

  // Psychiatric / Behavioral & Substance Use Disorder Chapter
  const psychiatricChapter = await prisma.chapter.upsert({
    where: {
      sectionId_name: {
        sectionId: clinicalSciencesSection.id,
        name: "Psychiatric / Behavioral & Substance Use Disorder",
      },
    },
    update: {},
    create: {
      sectionId: clinicalSciencesSection.id,
      name: "Psychiatric / Behavioral & Substance Use Disorder",
      order: 3,
      isActive: true,
    },
  });

  const psychiatricTopics = [
    "Normal behavior and development",
    "Anxiety and trauma-related disorders",
    "Mood disorders",
    "Neurodevelopmental disorders",
    "Personality disorders",
    "Psychotic disorders",
    "Substance use disorders",
    "Eating disorders",
    "Somatoform disorders",
    "Miscellaneous",
  ];

  for (let i = 0; i < psychiatricTopics.length; i++) {
    await prisma.topic.upsert({
      where: {
        chapterId_name: {
          chapterId: psychiatricChapter.id,
          name: psychiatricTopics[i],
        },
      },
      update: {},
      create: {
        chapterId: psychiatricChapter.id,
        name: psychiatricTopics[i],
        order: i + 1,
        isActive: true,
      },
    });
  }

  // Social Sciences Chapter
  const socialSciencesChapter = await prisma.chapter.upsert({
    where: {
      sectionId_name: {
        sectionId: clinicalSciencesSection.id,
        name: "Social Sciences (Ethics / Legal / Professional)",
      },
    },
    update: {},
    create: {
      sectionId: clinicalSciencesSection.id,
      name: "Social Sciences (Ethics / Legal / Professional)",
      order: 4,
      isActive: true,
    },
  });

  const socialSciencesTopics = [
    "Communication and interpersonal skills",
    "Healthcare policy and economics",
    "Medical ethics and jurisprudence",
    "Patient safety",
    "System-based practice and quality improvement",
    "Miscellaneous",
  ];

  for (let i = 0; i < socialSciencesTopics.length; i++) {
    await prisma.topic.upsert({
      where: {
        chapterId_name: {
          chapterId: socialSciencesChapter.id,
          name: socialSciencesTopics[i],
        },
      },
      update: {},
      create: {
        chapterId: socialSciencesChapter.id,
        name: socialSciencesTopics[i],
        order: i + 1,
        isActive: true,
      },
    });
  }

  // Miscellaneous (Multisystem) Chapter
  const miscellaneousChapter = await prisma.chapter.upsert({
    where: {
      sectionId_name: {
        sectionId: clinicalSciencesSection.id,
        name: "Miscellaneous (Multisystem)",
      },
    },
    update: {},
    create: {
      sectionId: clinicalSciencesSection.id,
      name: "Miscellaneous (Multisystem)",
      order: 5,
      isActive: true,
    },
  });

  await prisma.topic.upsert({
    where: {
      chapterId_name: {
        chapterId: miscellaneousChapter.id,
        name: "Miscellaneous",
      },
    },
    update: {},
    create: {
      chapterId: miscellaneousChapter.id,
      name: "Miscellaneous",
      order: 1,
      isActive: true,
    },
  });

  // ========== ORGAN SYSTEMS SECTION ==========
  const organSystemsSection = await prisma.section.upsert({
    where: {
      productId_name: { productId: usmleProduct.id, name: "Organ Systems" },
    },
    update: {},
    create: {
      productId: usmleProduct.id,
      name: "Organ Systems",
      description: "Organ system-based medical knowledge",
      order: 3,
      isActive: true,
    },
  });

  // Allergy & Immunology Chapter
  const allergyChapter = await prisma.chapter.upsert({
    where: {
      sectionId_name: {
        sectionId: organSystemsSection.id,
        name: "Allergy & Immunology",
      },
    },
    update: {},
    create: {
      sectionId: organSystemsSection.id,
      name: "Allergy & Immunology",
      order: 1,
      isActive: true,
    },
  });

  const allergyTopics = [
    "Anaphylaxis and allergic reactions",
    "Autoimmune diseases",
    "Immune deficiencies",
    "Transplant medicine",
    "Principles of immunology",
    "Miscellaneous",
  ];

  for (let i = 0; i < allergyTopics.length; i++) {
    await prisma.topic.upsert({
      where: {
        chapterId_name: {
          chapterId: allergyChapter.id,
          name: allergyTopics[i],
        },
      },
      update: {},
      create: {
        chapterId: allergyChapter.id,
        name: allergyTopics[i],
        order: i + 1,
        isActive: true,
      },
    });
  }

  // Cardiovascular System Chapter
  const cardiovascularChapter = await prisma.chapter.upsert({
    where: {
      sectionId_name: {
        sectionId: organSystemsSection.id,
        name: "Cardiovascular System",
      },
    },
    update: {},
    create: {
      sectionId: organSystemsSection.id,
      name: "Cardiovascular System",
      order: 2,
      isActive: true,
    },
  });

  const cardiovascularTopics = [
    "Normal structure and function of the cardiovascular system",
    "Aortic and peripheral artery diseases",
    "Cardiac arrhythmias",
    "Congenital heart disease",
    "Coronary heart disease",
    "Heart failure and shock",
    "Hypertension",
    "Myopericardial diseases",
    "Valvular heart diseases",
    "Cardiovascular drugs",
    "Miscellaneous",
  ];

  for (let i = 0; i < cardiovascularTopics.length; i++) {
    await prisma.topic.upsert({
      where: {
        chapterId_name: {
          chapterId: cardiovascularChapter.id,
          name: cardiovascularTopics[i],
        },
      },
      update: {},
      create: {
        chapterId: cardiovascularChapter.id,
        name: cardiovascularTopics[i],
        order: i + 1,
        isActive: true,
      },
    });
  }

  // Dermatology Chapter
  const dermatologyChapter = await prisma.chapter.upsert({
    where: {
      sectionId_name: {
        sectionId: organSystemsSection.id,
        name: "Dermatology",
      },
    },
    update: {},
    create: {
      sectionId: organSystemsSection.id,
      name: "Dermatology",
      order: 3,
      isActive: true,
    },
  });

  const dermatologyTopics = [
    "Normal structure and function of skin",
    "Disorders of epidermal appendages",
    "Inflammatory dermatoses and bullous diseases",
    "Skin and soft tissue infections",
    "Skin tumors and tumor-like lesions",
    "Miscellaneous",
  ];

  for (let i = 0; i < dermatologyTopics.length; i++) {
    await prisma.topic.upsert({
      where: {
        chapterId_name: {
          chapterId: dermatologyChapter.id,
          name: dermatologyTopics[i],
        },
      },
      update: {},
      create: {
        chapterId: dermatologyChapter.id,
        name: dermatologyTopics[i],
        order: i + 1,
        isActive: true,
      },
    });
  }

  // ENT Chapter
  const entChapter = await prisma.chapter.upsert({
    where: {
      sectionId_name: {
        sectionId: organSystemsSection.id,
        name: "Ear, Nose & Throat (ENT)",
      },
    },
    update: {},
    create: {
      sectionId: organSystemsSection.id,
      name: "Ear, Nose & Throat (ENT)",
      order: 4,
      isActive: true,
    },
  });

  await prisma.topic.upsert({
    where: {
      chapterId_name: {
        chapterId: entChapter.id,
        name: "Disorders of the ear, nose, and throat",
      },
    },
    update: {},
    create: {
      chapterId: entChapter.id,
      name: "Disorders of the ear, nose, and throat",
      order: 1,
      isActive: true,
    },
  });

  // Endocrine, Diabetes & Metabolism Chapter
  const endocrineChapter = await prisma.chapter.upsert({
    where: {
      sectionId_name: {
        sectionId: organSystemsSection.id,
        name: "Endocrine, Diabetes & Metabolism",
      },
    },
    update: {},
    create: {
      sectionId: organSystemsSection.id,
      name: "Endocrine, Diabetes & Metabolism",
      order: 5,
      isActive: true,
    },
  });

  const endocrineTopics = [
    "Normal structure and function of endocrine glands",
    "Congenital and developmental anomalies",
    "Adrenal disorders",
    "Diabetes mellitus",
    "Endocrine tumors",
    "Hypothalamus and pituitary disorders",
    "Obesity and dyslipidemia",
    "Reproductive endocrinology",
    "Thyroid disorders",
    "Miscellaneous",
  ];

  for (let i = 0; i < endocrineTopics.length; i++) {
    await prisma.topic.upsert({
      where: {
        chapterId_name: {
          chapterId: endocrineChapter.id,
          name: endocrineTopics[i],
        },
      },
      update: {},
      create: {
        chapterId: endocrineChapter.id,
        name: endocrineTopics[i],
        order: i + 1,
        isActive: true,
      },
    });
  }

  // Female Reproductive System & Breast Chapter
  const femaleReproductiveChapter = await prisma.chapter.upsert({
    where: {
      sectionId_name: {
        sectionId: organSystemsSection.id,
        name: "Female Reproductive System & Breast",
      },
    },
    update: {},
    create: {
      sectionId: organSystemsSection.id,
      name: "Female Reproductive System & Breast",
      order: 6,
      isActive: true,
    },
  });

  const femaleReproductiveTopics = [
    "Normal structure and function of the female reproductive system and breast",
    "Congenital and developmental anomalies",
    "Breast disorders",
    "Genital tract tumors and tumor-like lesions",
    "Genitourinary tract infections",
    "Menstrual disorders and contraception",
    "Miscellaneous",
  ];

  for (let i = 0; i < femaleReproductiveTopics.length; i++) {
    await prisma.topic.upsert({
      where: {
        chapterId_name: {
          chapterId: femaleReproductiveChapter.id,
          name: femaleReproductiveTopics[i],
        },
      },
      update: {},
      create: {
        chapterId: femaleReproductiveChapter.id,
        name: femaleReproductiveTopics[i],
        order: i + 1,
        isActive: true,
      },
    });
  }

  // Gastrointestinal & Nutrition Chapter
  const giChapter = await prisma.chapter.upsert({
    where: {
      sectionId_name: {
        sectionId: organSystemsSection.id,
        name: "Gastrointestinal & Nutrition",
      },
    },
    update: {},
    create: {
      sectionId: organSystemsSection.id,
      name: "Gastrointestinal & Nutrition",
      order: 7,
      isActive: true,
    },
  });

  const giTopics = [
    "Normal structure and function of the GI tract",
    "Congenital and developmental anomalies",
    "Biliary tract disorders",
    "Disorders of nutrition",
    "Gastroesophageal disorders",
    "Hepatic disorders",
    "Intestinal and colorectal disorders",
    "Pancreatic disorders",
    "Tumors of the GI tract",
    "Miscellaneous",
  ];

  for (let i = 0; i < giTopics.length; i++) {
    await prisma.topic.upsert({
      where: { chapterId_name: { chapterId: giChapter.id, name: giTopics[i] } },
      update: {},
      create: {
        chapterId: giChapter.id,
        name: giTopics[i],
        order: i + 1,
        isActive: true,
      },
    });
  }

  // Hematology & Oncology Chapter
  const hematologyChapter = await prisma.chapter.upsert({
    where: {
      sectionId_name: {
        sectionId: organSystemsSection.id,
        name: "Hematology & Oncology",
      },
    },
    update: {},
    create: {
      sectionId: organSystemsSection.id,
      name: "Hematology & Oncology",
      order: 8,
      isActive: true,
    },
  });

  const hematologyTopics = [
    "Normal hematologic structure and function",
    "Hemostasis and thrombosis",
    "Plasma cell disorders",
    "Platelet disorders",
    "Red blood cell disorders",
    "Transfusion medicine",
    "White blood cell disorders",
    "Principles of oncology",
    "Miscellaneous",
  ];

  for (let i = 0; i < hematologyTopics.length; i++) {
    await prisma.topic.upsert({
      where: {
        chapterId_name: {
          chapterId: hematologyChapter.id,
          name: hematologyTopics[i],
        },
      },
      update: {},
      create: {
        chapterId: hematologyChapter.id,
        name: hematologyTopics[i],
        order: i + 1,
        isActive: true,
      },
    });
  }

  // Infectious Diseases Chapter
  const infectiousDiseasesChapter = await prisma.chapter.upsert({
    where: {
      sectionId_name: {
        sectionId: organSystemsSection.id,
        name: "Infectious Diseases",
      },
    },
    update: {},
    create: {
      sectionId: organSystemsSection.id,
      name: "Infectious Diseases",
      order: 9,
      isActive: true,
    },
  });

  const infectiousDiseasesTopics = [
    "Antimicrobial drugs",
    "Bacterial infections",
    "Fungal infections",
    "HIV and sexually transmitted infections",
    "Infection control",
    "Parasitic and helminthic infections",
    "Viral infections",
    "Miscellaneous",
  ];

  for (let i = 0; i < infectiousDiseasesTopics.length; i++) {
    await prisma.topic.upsert({
      where: {
        chapterId_name: {
          chapterId: infectiousDiseasesChapter.id,
          name: infectiousDiseasesTopics[i],
        },
      },
      update: {},
      create: {
        chapterId: infectiousDiseasesChapter.id,
        name: infectiousDiseasesTopics[i],
        order: i + 1,
        isActive: true,
      },
    });
  }

  // Male Reproductive System Chapter
  const maleReproductiveChapter = await prisma.chapter.upsert({
    where: {
      sectionId_name: {
        sectionId: organSystemsSection.id,
        name: "Male Reproductive System",
      },
    },
    update: {},
    create: {
      sectionId: organSystemsSection.id,
      name: "Male Reproductive System",
      order: 10,
      isActive: true,
    },
  });

  const maleReproductiveTopics = [
    "Normal structure and function of the male reproductive system",
    "Disorders of the male reproductive system",
  ];

  for (let i = 0; i < maleReproductiveTopics.length; i++) {
    await prisma.topic.upsert({
      where: {
        chapterId_name: {
          chapterId: maleReproductiveChapter.id,
          name: maleReproductiveTopics[i],
        },
      },
      update: {},
      create: {
        chapterId: maleReproductiveChapter.id,
        name: maleReproductiveTopics[i],
        order: i + 1,
        isActive: true,
      },
    });
  }

  // Nervous System Chapter
  const nervousSystemChapter = await prisma.chapter.upsert({
    where: {
      sectionId_name: {
        sectionId: organSystemsSection.id,
        name: "Nervous System",
      },
    },
    update: {},
    create: {
      sectionId: organSystemsSection.id,
      name: "Nervous System",
      order: 11,
      isActive: true,
    },
  });

  const nervousSystemTopics = [
    "Normal structure and function of the nervous system",
    "Congenital and developmental anomalies",
    "Cerebrovascular disease",
    "CNS infections",
    "Demyelinating diseases",
    "Disorders of peripheral nerves and muscles",
    "Headache",
    "Neurodegenerative disorders and dementias",
    "Seizures and epilepsy",
    "Spinal cord disorders",
    "Traumatic brain injuries",
    "Tumors of the nervous system",
    "Hydrocephalus",
    "Anesthesia",
    "Sleep disorders",
    "Miscellaneous",
  ];

  for (let i = 0; i < nervousSystemTopics.length; i++) {
    await prisma.topic.upsert({
      where: {
        chapterId_name: {
          chapterId: nervousSystemChapter.id,
          name: nervousSystemTopics[i],
        },
      },
      update: {},
      create: {
        chapterId: nervousSystemChapter.id,
        name: nervousSystemTopics[i],
        order: i + 1,
        isActive: true,
      },
    });
  }

  // Ophthalmology Chapter
  const ophthalmologyChapter = await prisma.chapter.upsert({
    where: {
      sectionId_name: {
        sectionId: organSystemsSection.id,
        name: "Ophthalmology",
      },
    },
    update: {},
    create: {
      sectionId: organSystemsSection.id,
      name: "Ophthalmology",
      order: 12,
      isActive: true,
    },
  });

  const ophthalmologyTopics = [
    "Normal structure and function of the eye and associated structures",
    "Disorders of the eye and associated structures",
  ];

  for (let i = 0; i < ophthalmologyTopics.length; i++) {
    await prisma.topic.upsert({
      where: {
        chapterId_name: {
          chapterId: ophthalmologyChapter.id,
          name: ophthalmologyTopics[i],
        },
      },
      update: {},
      create: {
        chapterId: ophthalmologyChapter.id,
        name: ophthalmologyTopics[i],
        order: i + 1,
        isActive: true,
      },
    });
  }

  // Pregnancy, Childbirth & Puerperium Chapter
  const pregnancyChapter = await prisma.chapter.upsert({
    where: {
      sectionId_name: {
        sectionId: organSystemsSection.id,
        name: "Pregnancy, Childbirth & Puerperium",
      },
    },
    update: {},
    create: {
      sectionId: organSystemsSection.id,
      name: "Pregnancy, Childbirth & Puerperium",
      order: 13,
      isActive: true,
    },
  });

  const pregnancyTopics = [
    "Normal pregnancy, childbirth, and puerperium",
    "Disorders of pregnancy, childbirth, and puerperium",
  ];

  for (let i = 0; i < pregnancyTopics.length; i++) {
    await prisma.topic.upsert({
      where: {
        chapterId_name: {
          chapterId: pregnancyChapter.id,
          name: pregnancyTopics[i],
        },
      },
      update: {},
      create: {
        chapterId: pregnancyChapter.id,
        name: pregnancyTopics[i],
        order: i + 1,
        isActive: true,
      },
    });
  }

  // Pulmonary & Critical Care Chapter
  const pulmonaryChapter = await prisma.chapter.upsert({
    where: {
      sectionId_name: {
        sectionId: organSystemsSection.id,
        name: "Pulmonary & Critical Care",
      },
    },
    update: {},
    create: {
      sectionId: organSystemsSection.id,
      name: "Pulmonary & Critical Care",
      order: 14,
      isActive: true,
    },
  });

  const pulmonaryTopics = [
    "Normal pulmonary structure and function",
    "Congenital and developmental anomalies",
    "Critical care medicine",
    "Interstitial lung disease",
    "Lung cancer",
    "Obstructive lung disease",
    "Pulmonary infections",
    "Pulmonary vascular disease",
    "Sleep disorders",
    "Miscellaneous",
  ];

  for (let i = 0; i < pulmonaryTopics.length; i++) {
    await prisma.topic.upsert({
      where: {
        chapterId_name: {
          chapterId: pulmonaryChapter.id,
          name: pulmonaryTopics[i],
        },
      },
      update: {},
      create: {
        chapterId: pulmonaryChapter.id,
        name: pulmonaryTopics[i],
        order: i + 1,
        isActive: true,
      },
    });
  }

  // Renal, Urinary Systems & Electrolytes Chapter
  const renalChapter = await prisma.chapter.upsert({
    where: {
      sectionId_name: {
        sectionId: organSystemsSection.id,
        name: "Renal, Urinary Systems & Electrolytes",
      },
    },
    update: {},
    create: {
      sectionId: organSystemsSection.id,
      name: "Renal, Urinary Systems & Electrolytes",
      order: 15,
      isActive: true,
    },
  });

  const renalTopics = [
    "Normal structure and function of the kidneys and urinary system",
    "Congenital and developmental anomalies",
    "Acute kidney injury",
    "Bone metabolism",
    "Chronic kidney disease",
    "Cystic kidney diseases",
    "Fluid, electrolytes, and acid-base",
    "Glomerular diseases",
    "Neoplasms of the kidneys and urinary tract",
    "Nephrolithiasis and urinary tract obstruction",
    "Diabetes insipidus",
    "Urinary incontinence",
    "Miscellaneous",
  ];

  for (let i = 0; i < renalTopics.length; i++) {
    await prisma.topic.upsert({
      where: {
        chapterId_name: { chapterId: renalChapter.id, name: renalTopics[i] },
      },
      update: {},
      create: {
        chapterId: renalChapter.id,
        name: renalTopics[i],
        order: i + 1,
        isActive: true,
      },
    });
  }

  // Rheumatology / Orthopedics & Sports Chapter
  const rheumatologyChapter = await prisma.chapter.upsert({
    where: {
      sectionId_name: {
        sectionId: organSystemsSection.id,
        name: "Rheumatology / Orthopedics & Sports",
      },
    },
    update: {},
    create: {
      sectionId: organSystemsSection.id,
      name: "Rheumatology / Orthopedics & Sports",
      order: 16,
      isActive: true,
    },
  });

  const rheumatologyTopics = [
    "Normal structure and function of the musculoskeletal system",
    "Congenital and developmental anomalies",
    "Arthritis and spondyloarthropathies",
    "Autoimmune disorders and vasculitides",
    "Bone/joint injuries and infections",
    "Bone tumors and tumor-like lesions",
    "Spinal disorders and back pain",
    "Metabolic bone disorders",
    "Miscellaneous",
  ];

  for (let i = 0; i < rheumatologyTopics.length; i++) {
    await prisma.topic.upsert({
      where: {
        chapterId_name: {
          chapterId: rheumatologyChapter.id,
          name: rheumatologyTopics[i],
        },
      },
      update: {},
      create: {
        chapterId: rheumatologyChapter.id,
        name: rheumatologyTopics[i],
        order: i + 1,
        isActive: true,
      },
    });
  }

  // ========== PRODUCT SUBTYPES ==========
  console.log("📦 Creating product subtypes...");

  const qbankSubtype = await prisma.productSubtype.upsert({
    where: { productId_name: { productId: usmleProduct.id, name: "Qbank" } },
    update: {},
    create: {
      productId: usmleProduct.id,
      name: "Qbank",
      description: "Comprehensive question bank for USMLE Step 1 preparation",
      isActive: true,
    },
  });

  const selfAssessmentSubtype = await prisma.productSubtype.upsert({
    where: {
      productId_name: { productId: usmleProduct.id, name: "Self-Assessment" },
    },
    update: {},
    create: {
      productId: usmleProduct.id,
      name: "Self-Assessment",
      description:
        "Full-length practice exams that simulate the real USMLE Step 1",
      isActive: true,
    },
  });

  const biostatisticsReviewSubtype = await prisma.productSubtype.upsert({
    where: {
      productId_name: {
        productId: usmleProduct.id,
        name: "Biostatistics Review",
      },
    },
    update: {},
    create: {
      productId: usmleProduct.id,
      name: "Biostatistics Review",
      description: "Focused biostatistics and epidemiology review module",
      isActive: true,
    },
  });

  // ========== PACKAGE FEATURES ==========
  console.log("✨ Creating package features...");

  const features: Record<string, any> = {};
  const featureNames = [
    "Qbank Access",
    "Self Assessment",
    "One Time Reset",
    "Study Planner",
    "Performance Analytics",
    "Flashcards",
  ];

  for (const featureName of featureNames) {
    const feature = await prisma.packageFeatures.upsert({
      where: { name: featureName },
      update: {},
      create: {
        name: featureName,
        description: `Access to ${featureName.toLowerCase()} feature`,
        isActive: true,
      },
    });
    features[featureName] = feature;
  }

  // ========== SUBSCRIPTION PACKAGES ==========
  console.log("💎 Creating subscription packages...");

  // Basic Package - 30 days, Qbank only
  const basicPackage = await prisma.subscriptionPackage.upsert({
    where: {
      productSubtypeId_name: {
        productSubtypeId: qbankSubtype.id,
        name: "Basic",
      },
    },
    update: {},
    create: {
      productSubtypeId: qbankSubtype.id,
      name: "Basic",
      description: "30-day access to Qbank",
      price: 49.99,
      currency: "USD",
      validityDays: 30,
      isActive: true,
    },
  });

  await prisma.subscriptionFeatures.upsert({
    where: {
      subscriptionPackageId_packageFeatureId: {
        subscriptionPackageId: basicPackage.id,
        packageFeatureId: features["Qbank Access"].id,
      },
    },
    update: {},
    create: {
      subscriptionPackageId: basicPackage.id,
      packageFeatureId: features["Qbank Access"].id,
    },
  });

  // Standard Package - 90 days, Qbank + 1 Self Assessment
  const standardPackage = await prisma.subscriptionPackage.upsert({
    where: {
      productSubtypeId_name: {
        productSubtypeId: qbankSubtype.id,
        name: "Standard",
      },
    },
    update: {},
    create: {
      productSubtypeId: qbankSubtype.id,
      name: "Standard",
      description: "90-day access to Qbank plus 1 self-assessment exam",
      price: 129.99,
      currency: "USD",
      validityDays: 90,
      isActive: true,
    },
  });

  await prisma.subscriptionFeatures.upsert({
    where: {
      subscriptionPackageId_packageFeatureId: {
        subscriptionPackageId: standardPackage.id,
        packageFeatureId: features["Qbank Access"].id,
      },
    },
    update: {},
    create: {
      subscriptionPackageId: standardPackage.id,
      packageFeatureId: features["Qbank Access"].id,
    },
  });

  await prisma.subscriptionFeatures.upsert({
    where: {
      subscriptionPackageId_packageFeatureId: {
        subscriptionPackageId: standardPackage.id,
        packageFeatureId: features["Self Assessment"].id,
      },
    },
    update: {},
    create: {
      subscriptionPackageId: standardPackage.id,
      packageFeatureId: features["Self Assessment"].id,
    },
  });

  await prisma.subscriptionFeatures.upsert({
    where: {
      subscriptionPackageId_packageFeatureId: {
        subscriptionPackageId: standardPackage.id,
        packageFeatureId: features["Study Planner"].id,
      },
    },
    update: {},
    create: {
      subscriptionPackageId: standardPackage.id,
      packageFeatureId: features["Study Planner"].id,
    },
  });

  // Premium Package - 180 days, All features
  const premiumPackage = await prisma.subscriptionPackage.upsert({
    where: {
      productSubtypeId_name: {
        productSubtypeId: qbankSubtype.id,
        name: "Premium",
      },
    },
    update: {},
    create: {
      productSubtypeId: qbankSubtype.id,
      name: "Premium",
      description: "180-day access with all features included",
      price: 249.99,
      currency: "USD",
      validityDays: 180,
      isActive: true,
    },
  });

  for (const feature of Object.values(features)) {
    await prisma.subscriptionFeatures.upsert({
      where: {
        subscriptionPackageId_packageFeatureId: {
          subscriptionPackageId: premiumPackage.id,
          packageFeatureId: feature.id,
        },
      },
      update: {},
      create: {
        subscriptionPackageId: premiumPackage.id,
        packageFeatureId: feature.id,
      },
    });
  }

  // Ultimate Package - 365 days, All features + extras
  const ultimatePackage = await prisma.subscriptionPackage.upsert({
    where: {
      productSubtypeId_name: {
        productSubtypeId: qbankSubtype.id,
        name: "Ultimate",
      },
    },
    update: {},
    create: {
      productSubtypeId: qbankSubtype.id,
      name: "Ultimate",
      description:
        "Full-year access with all features and unlimited assessments",
      price: 449.99,
      currency: "USD",
      validityDays: 365,
      isActive: true,
    },
  });

  for (const feature of Object.values(features)) {
    await prisma.subscriptionFeatures.upsert({
      where: {
        subscriptionPackageId_packageFeatureId: {
          subscriptionPackageId: ultimatePackage.id,
          packageFeatureId: feature.id,
        },
      },
      update: {},
      create: {
        subscriptionPackageId: ultimatePackage.id,
        packageFeatureId: feature.id,
      },
    });
  }

  console.log("✅ USMLE database seeding completed successfully!");
  console.log("\n📊 Summary:");
  console.log(`- Product: USMLE Step 1`);
  console.log(`- Product Tags: ${tagNames.length}`);
  console.log(
    `- Sections: 3 (General Principles, Clinical Sciences, Organ Systems)`
  );
  console.log(`- Chapters: 26`);
  console.log(`- Topics: 169+`);
  console.log(
    `- Product Subtypes: 3 (Qbank, Self-Assessment, Biostatistics Review)`
  );
  console.log(`- Package Features: ${featureNames.length}`);
  console.log(
    `- Subscription Packages: 4 (Basic, Standard, Premium, Ultimate)`
  );
}
