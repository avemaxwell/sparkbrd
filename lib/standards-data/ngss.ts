import type { Standard } from '@/lib/standards';

// Hand-curated starter set of Next Generation Science Standards Performance
// Expectations — NOT exhaustive. Unlike Common Core, there's no clean public
// JSON dataset for NGSS, so this is a modest, verified subset (K-1 codes
// pulled directly from nextgenscience.org during research; the rest are
// widely-published, stable PE codes unchanged since NGSS's 2013 release).
// Good candidate to replace with a full licensed dataset later if needed.
export const NGSS: Standard[] = [
  { code: "K-PS2-1", text: "Plan and conduct an investigation to compare the effects of different strengths or different directions of pushes and pulls on the motion of an object.", subject: "Science", gradeBands: ["K-5"] },
  { code: "K-PS2-2", text: "Analyze data to determine if a design solution works as intended to change the speed or direction of an object with a push or a pull.", subject: "Science", gradeBands: ["K-5"] },
  { code: "K-LS1-1", text: "Use observations to describe patterns of what plants and animals (including humans) need to survive.", subject: "Science", gradeBands: ["K-5"] },
  { code: "K-ESS2-1", text: "Use and share observations of local weather conditions to describe patterns over time.", subject: "Science", gradeBands: ["K-5"] },
  { code: "K-ESS3-1", text: "Use a model to represent the relationship between the needs of different plants and animals (including humans) and the places they live.", subject: "Science", gradeBands: ["K-5"] },
  { code: "K-ESS3-3", text: "Communicate solutions that will reduce the impact of humans on the land, water, air, and/or other living things in the local environment.", subject: "Science", gradeBands: ["K-5"] },
  { code: "1-PS4-1", text: "Plan and conduct investigations to provide evidence that vibrating materials can make sound and that sound can make materials vibrate.", subject: "Science", gradeBands: ["K-5"] },
  { code: "1-PS4-2", text: "Make observations to construct an evidence-based account that objects in darkness can be seen only when illuminated.", subject: "Science", gradeBands: ["K-5"] },
  { code: "1-LS1-1", text: "Use materials to design a solution to a human problem by mimicking how plants and/or animals use their external parts to help them survive, grow, and meet their needs.", subject: "Science", gradeBands: ["K-5"] },
  { code: "3-LS4-3", text: "Construct an argument with evidence that in a particular habitat some organisms can survive well, some survive less well, and some cannot survive at all.", subject: "Science", gradeBands: ["K-5"] },
  { code: "4-ESS1-1", text: "Identify evidence from patterns in rock formations and fossils in rock layers to support an explanation for changes in a landscape over time.", subject: "Science", gradeBands: ["K-5"] },
  { code: "5-PS1-3", text: "Make observations and measurements to identify materials based on their properties.", subject: "Science", gradeBands: ["K-5"] },
  { code: "5-ESS3-1", text: "Obtain and combine information about ways individual communities use science ideas to protect the Earth's resources and environment.", subject: "Science", gradeBands: ["K-5"] },
  { code: "MS-PS1-1", text: "Develop models to describe the atomic composition of simple molecules and extended structures.", subject: "Science", gradeBands: ["6-8"] },
  { code: "MS-PS2-2", text: "Plan an investigation to provide evidence that the change in an object's motion depends on the sum of the forces on the object and the mass of the object.", subject: "Science", gradeBands: ["6-8"] },
  { code: "MS-LS1-1", text: "Conduct an investigation to provide evidence that living things are made of cells; either one cell or many different numbers and types of cells.", subject: "Science", gradeBands: ["6-8"] },
  { code: "MS-LS2-1", text: "Analyze and interpret data to provide evidence for the effects of resource availability on organisms and populations of organisms in an ecosystem.", subject: "Science", gradeBands: ["6-8"] },
  { code: "MS-ESS2-1", text: "Develop a model to describe the cycling of Earth's materials and the flow of energy that drives this process.", subject: "Science", gradeBands: ["6-8"] },
  { code: "MS-ESS3-3", text: "Apply scientific principles to design a method for monitoring and minimizing a human impact on the environment.", subject: "Science", gradeBands: ["6-8"] },
  { code: "MS-ETS1-1", text: "Define the criteria and constraints of a design problem with sufficient precision to ensure a successful solution, taking into account relevant scientific principles and potential impacts on people and the natural environment.", subject: "Science", gradeBands: ["6-8"] },
  { code: "HS-PS1-2", text: "Construct and revise an explanation for the outcome of a simple chemical reaction based on the outermost electron states of atoms, trends in the periodic table, and knowledge of the patterns of chemical properties.", subject: "Science", gradeBands: ["9-12"] },
  { code: "HS-PS2-1", text: "Analyze data to support the claim that Newton's second law of motion describes the mathematical relationship among the net force on a macroscopic object, its mass, and its acceleration.", subject: "Science", gradeBands: ["9-12"] },
  { code: "HS-LS1-2", text: "Develop and use a model to illustrate the hierarchical organization of interacting systems that provide specific functions within multicellular organisms.", subject: "Science", gradeBands: ["9-12"] },
  { code: "HS-LS2-6", text: "Evaluate the claims, evidence, and reasoning that the complex interactions in ecosystems maintain relatively consistent numbers and types of organisms in stable conditions, but changing conditions may result in a new ecosystem.", subject: "Science", gradeBands: ["9-12"] },
  { code: "HS-ESS2-2", text: "Analyze geoscience data to make the claim that one change to Earth's surface can create feedbacks that cause changes to other Earth systems.", subject: "Science", gradeBands: ["9-12"] },
  { code: "HS-ESS3-4", text: "Evaluate or refine a technological solution that reduces impacts of human activities on natural systems.", subject: "Science", gradeBands: ["9-12"] },
  { code: "HS-ETS1-2", text: "Design a solution to a complex real-world problem by breaking it down into smaller, more manageable problems that can be solved through engineering.", subject: "Science", gradeBands: ["9-12"] },
];
