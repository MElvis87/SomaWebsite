/* Adds factual notes and model spaces to existing subject topics without changing core markup. */
(function () {
  "use strict";

  var DATA = {
    "3dbio.html": {
      collapseCell: topic("Cell Biology", [
        "Cells are the smallest units that carry out all life processes, including metabolism, growth, response, and reproduction.",
        "Eukaryotic cells contain a nucleus and membrane-bound organelles, while prokaryotic cells lack a true nucleus and are usually smaller.",
        "The plasma membrane is selectively permeable, controlling movement of substances into and out of the cell.",
        "Organelles divide labor: mitochondria release usable energy, ribosomes build proteins, and the nucleus stores genetic instructions."
      ], "Cell biology explains how living organisms function from the inside out.", "cell organelles, membrane transport, and plant versus animal cell comparison"),
      collapseGenetics: topic("Genetics", [
        "Genes are segments of DNA that influence traits by coding for functional RNA or proteins.",
        "DNA stores information in nucleotide sequences built from adenine, thymine, cytosine, and guanine.",
        "Mendelian inheritance describes how dominant and recessive alleles can be passed from parents to offspring.",
        "Mutations can be neutral, harmful, or beneficial depending on how they affect gene function and environment."
      ], "Genetics connects molecular information to inheritance, variation, disease, and evolution.", "DNA double helix, chromosome structure, or Punnett square inheritance model"),
      collapseAnatomy: topic("Human Anatomy and Physiology", [
        "Anatomy studies body structures, while physiology explains how those structures work.",
        "Human organ systems work together to maintain homeostasis, the stable internal conditions needed for survival.",
        "The circulatory system transports oxygen, nutrients, hormones, and wastes through blood vessels.",
        "The nervous and endocrine systems coordinate responses using electrical impulses and chemical signals."
      ], "Anatomy and physiology make body systems easier to understand as connected, working networks.", "human torso, heart, skeleton, neuron, or organ system model"),
      collapseEcology: topic("Ecology", [
        "Ecology studies interactions among organisms and between organisms and their physical environment.",
        "Energy flows through ecosystems from producers to consumers and decomposers, but nutrients cycle repeatedly.",
        "Population size changes through birth, death, immigration, emigration, and limits such as food or disease.",
        "Biodiversity increases ecosystem resilience by giving communities more ways to respond to disturbance."
      ], "Ecology explains food webs, conservation, resource use, and environmental change.", "food web, ecosystem layers, or nutrient cycle model"),
      collapseEvolution: topic("Evolution", [
        "Evolution is change in the inherited characteristics of populations over generations.",
        "Natural selection favors traits that improve survival or reproduction in a specific environment.",
        "Evidence for evolution includes fossils, DNA similarities, comparative anatomy, and observed adaptation.",
        "Speciation can occur when populations become reproductively isolated and diverge genetically."
      ], "Evolution explains both the unity and diversity of life on Earth.", "fossil timeline, homologous limbs, or branching tree of life"),
      collapseMitosis: topic("Cell Division: Mitosis", [
        "Mitosis produces two genetically identical daughter nuclei from one parent nucleus.",
        "Chromosomes condense, align, separate, and are packaged into new nuclei during prophase, metaphase, anaphase, and telophase.",
        "Cytokinesis divides the cytoplasm after nuclear division.",
        "Mitosis supports growth, tissue repair, and asexual reproduction in many organisms."
      ], "Mitosis is easier to understand when chromosome movement is visualized step by step.", "animated mitosis phase sequence"),
      collapseMicro: topic("Microbiology", [
        "Microbiology studies organisms and agents too small to see clearly without magnification, including bacteria, fungi, protists, and viruses.",
        "Bacteria are prokaryotic cells with diverse shapes such as cocci, bacilli, and spirilla.",
        "Microbes can cause disease, but many are essential for digestion, decomposition, fermentation, and nutrient cycling.",
        "Sterile technique reduces contamination when growing or examining microbial cultures."
      ], "Microbiology shows that invisible organisms have major effects on health and ecosystems.", "bacterial cell, virus structure, or microscope field model"),
      collapsePlants: topic("Plant Biology", [
        "Plants make sugars by photosynthesis, using light energy, carbon dioxide, and water.",
        "Roots absorb water and minerals, stems support transport, and leaves are specialized for gas exchange and photosynthesis.",
        "Xylem moves water and dissolved minerals, while phloem moves sugars and other organic compounds.",
        "Flowers, seeds, and fruits support plant reproduction and dispersal."
      ], "Plant biology connects structure to survival, food production, and ecosystems.", "flower anatomy, leaf cross-section, root system, or vascular tissue model"),
      collapseBiochem: topic("Biochemistry", [
        "Biochemistry studies the molecules and reactions that make life possible.",
        "Proteins, carbohydrates, lipids, and nucleic acids are major biomolecules with distinct structures and functions.",
        "Enzymes speed up chemical reactions by lowering activation energy without being consumed.",
        "ATP transfers usable energy for cellular work such as transport, movement, and biosynthesis."
      ], "Biochemistry links chemistry to metabolism, genetics, nutrition, and medicine.", "enzyme active site, ATP cycle, or protein folding model"),
      collapseDevelop: topic("Developmental Biology", [
        "Developmental biology studies how organisms grow from a single cell into complex multicellular forms.",
        "Cell division, differentiation, and morphogenesis shape tissues and organs.",
        "Gene expression controls when and where cells specialize during development.",
        "Stem cells can self-renew and produce specialized cell types under the right signals."
      ], "Development explains how body plans form and how errors can cause developmental disorders.", "embryo stages, stem cell differentiation, or tissue formation model"),
      collapseBiotech: topic("Biotechnology", [
        "Biotechnology uses living systems or biological molecules to make useful products or solve problems.",
        "Genetic engineering can modify DNA to change traits or produce proteins such as insulin.",
        "PCR amplifies DNA segments, making small genetic samples easier to study.",
        "Biotechnology is used in medicine, agriculture, environmental cleanup, and industrial fermentation."
      ], "Biotechnology shows how biological knowledge becomes practical tools.", "DNA editing, PCR cycle, or bioreactor model")
    },
    "3dchem.html": {
      collapseIntro: topic("Introduction to Chemistry", [
        "Chemistry studies matter, its properties, composition, structure, and changes.",
        "Matter is made of atoms and molecules that interact through chemical and physical processes.",
        "Chemical changes form new substances, while physical changes alter form or state without changing composition.",
        "Measurement, observation, and controlled experiments are central to chemical investigation."
      ], "Chemistry explains materials, reactions, medicines, fuels, and environmental processes.", "particle view of matter and simple reaction model"),
      collapseAtomic: topic("Atomic Structure", [
        "Atoms contain protons and neutrons in the nucleus, with electrons occupying regions around the nucleus.",
        "Atomic number equals the number of protons and identifies the element.",
        "Isotopes are atoms of the same element with different numbers of neutrons.",
        "Electron arrangement helps determine bonding behavior and chemical reactivity."
      ], "Atomic structure is the foundation for the periodic table and chemical bonding.", "atom model with nucleus, electron shells, and isotopes"),
      collapsePeriodic: topic("Periodic Table", [
        "The periodic table arranges elements by atomic number and repeating chemical properties.",
        "Elements in the same group often have similar valence electron patterns and similar reactivity.",
        "Metals generally conduct heat and electricity, while nonmetals vary widely in physical properties.",
        "Periodic trends include atomic radius, ionization energy, electronegativity, and metallic character."
      ], "The periodic table is a predictive map of element behavior.", "interactive periodic table with trends"),
      collapseBonding: topic("Chemical Bonding", [
        "Chemical bonds form when atoms share, gain, lose, or attract electrons to reach more stable arrangements.",
        "Ionic bonds involve attraction between oppositely charged ions.",
        "Covalent bonds involve shared electron pairs between atoms.",
        "Molecular shape and polarity influence boiling point, solubility, and biological function."
      ], "Bonding explains why substances have different shapes, strengths, and properties.", "ionic lattice, covalent molecule, or molecular geometry model"),
      collapseReactions: topic("Chemical Reactions", [
        "A chemical reaction rearranges atoms to form new substances while conserving matter.",
        "Balanced equations show equal numbers of each type of atom on both sides.",
        "Reaction types include synthesis, decomposition, single replacement, double replacement, combustion, and acid-base reactions.",
        "Reaction rate depends on factors such as temperature, concentration, surface area, and catalysts."
      ], "Reactions explain transformations in labs, industry, living cells, and the environment.", "reaction pathway or molecular collision model"),
      collapseStoich: topic("Stoichiometry", [
        "Stoichiometry uses balanced equations to calculate amounts of reactants and products.",
        "The mole connects particle counts to measurable mass using Avogadro's number.",
        "A limiting reactant is consumed first and determines the maximum product yield.",
        "Percent yield compares actual product obtained with the theoretical amount predicted."
      ], "Stoichiometry is essential for accurate lab preparation and industrial production.", "mole ratio or limiting reactant model"),
      collapseStates: topic("States of Matter", [
        "Solids have fixed shape and volume, liquids have fixed volume, and gases expand to fill containers.",
        "Particle energy and attraction explain differences between solid, liquid, gas, and plasma.",
        "Phase changes involve energy transfer without changing chemical identity.",
        "Pressure and temperature affect boiling, melting, condensation, and sublimation."
      ], "States of matter connect particle motion to visible material behavior.", "particle motion in solid, liquid, and gas"),
      collapseSolutions: topic("Solutions and Colloids", [
        "A solution is a homogeneous mixture of solute dissolved in solvent.",
        "Solubility depends on temperature, pressure, and molecular interactions.",
        "Concentration can be expressed using molarity, percent composition, or parts per million.",
        "Colloids contain dispersed particles that do not settle quickly and can scatter light."
      ], "Solutions explain medicines, water quality, foods, and many laboratory procedures.", "dissolving process, hydration shell, or colloid scattering model"),
      collapseAcidBase: topic("Acids, Bases, and Salts", [
        "Acids increase hydrogen ion concentration in water, while bases increase hydroxide ion concentration or accept protons.",
        "The pH scale measures acidity and is logarithmic, so each pH unit represents a tenfold change.",
        "Neutralization reactions between acids and bases can form salts and water.",
        "Buffers resist pH change and are important in blood, cells, and environmental systems."
      ], "Acid-base chemistry explains digestion, cleaning, agriculture, and biological stability.", "pH scale, proton transfer, or titration setup model"),
      collapseThermo: topic("Thermochemistry", [
        "Thermochemistry studies heat changes during chemical and physical processes.",
        "Exothermic processes release heat, while endothermic processes absorb heat.",
        "Enthalpy change measures heat transfer at constant pressure.",
        "Calorimetry can measure heat absorbed or released in a reaction."
      ], "Thermochemistry connects energy changes to fuels, reactions, and climate processes.", "energy diagram or calorimeter model"),
      collapseElectro: topic("Electrochemistry", [
        "Electrochemistry studies chemical reactions involving electron transfer.",
        "Oxidation is loss of electrons, while reduction is gain of electrons.",
        "Galvanic cells convert chemical energy into electrical energy.",
        "Electrolysis uses electrical energy to drive nonspontaneous chemical reactions."
      ], "Electrochemistry explains batteries, corrosion, electroplating, and fuel cells.", "galvanic cell, electron flow, or electrolysis model"),
      collapseOrganic: topic("Organic Chemistry", [
        "Organic chemistry focuses mainly on carbon-containing compounds.",
        "Carbon forms stable covalent bonds and can make chains, rings, and complex frameworks.",
        "Functional groups such as alcohols, carboxylic acids, amines, and alkenes influence reactivity.",
        "Isomers have the same molecular formula but different structures or arrangements."
      ], "Organic chemistry is central to fuels, plastics, medicines, and biomolecules.", "carbon skeleton, functional group, or isomer model"),
      collapseBiochemChem: topic("Biochemistry", [
        "Biochemistry applies chemical principles to living systems.",
        "Proteins fold into specific shapes that determine function.",
        "Carbohydrates store energy and provide structural support in some organisms.",
        "Nucleic acids store and transmit genetic information."
      ], "Biochemistry bridges molecular chemistry and biological function.", "protein, carbohydrate, lipid bilayer, or DNA model"),
      collapseNuclear: topic("Nuclear Chemistry", [
        "Nuclear chemistry studies changes in atomic nuclei rather than electron arrangements.",
        "Radioactive decay can emit alpha particles, beta particles, or gamma radiation.",
        "Half-life is the time required for half of a radioactive sample to decay.",
        "Nuclear fission splits heavy nuclei, while fusion joins light nuclei."
      ], "Nuclear chemistry explains medical imaging, dating methods, radiation safety, and nuclear energy.", "nucleus decay, fission chain reaction, or fusion model"),
      collapseAnalytical: topic("Analytical Chemistry", [
        "Analytical chemistry identifies and measures the composition of substances.",
        "Qualitative analysis asks what is present; quantitative analysis asks how much is present.",
        "Chromatography separates mixture components based on interactions with stationary and mobile phases.",
        "Spectroscopy uses light-matter interactions to infer structure or concentration."
      ], "Analytical chemistry supports medicine, forensics, food testing, and environmental monitoring.", "chromatography column or spectrometer model"),
      collapseEnvironmental: topic("Environmental Chemistry", [
        "Environmental chemistry studies chemical processes in air, water, soil, and living systems.",
        "Pollutants can move through ecosystems by air currents, water flow, and food webs.",
        "Acid rain forms when sulfur and nitrogen oxides react with water in the atmosphere.",
        "Water quality depends on dissolved oxygen, pH, nutrients, metals, and contaminants."
      ], "Environmental chemistry helps explain pollution, climate issues, and remediation.", "water treatment, carbon cycle, or pollution transport model"),
      collapseIndustrial: topic("Industrial Chemistry", [
        "Industrial chemistry applies chemical processes at large scale to make useful products.",
        "Process design considers yield, cost, energy use, safety, and environmental impact.",
        "Catalysts are widely used to increase reaction rate and selectivity.",
        "Industrial products include fertilizers, polymers, fuels, medicines, and cleaning agents."
      ], "Industrial chemistry shows how lab reactions become real-world manufacturing systems.", "chemical plant flow, reactor vessel, or catalyst surface model")
    },
    "3dcomp.html": {
      collapseIntro: topic("Introduction to Computers", [
        "A computer is an electronic system that accepts input, processes data, stores information, and produces output.",
        "Data becomes useful information when it is organized, processed, and interpreted.",
        "Computers follow instructions written as software programs.",
        "Modern computing includes personal devices, servers, embedded systems, and cloud services."
      ], "Computer basics explain how digital tools support learning, work, communication, and automation.", "input-process-output cycle or computer system overview"),
      collapseHardware: topic("Computer Hardware", [
        "Hardware refers to the physical components of a computer system.",
        "The CPU executes instructions and coordinates many operations.",
        "Motherboards connect major components such as CPU, memory, storage, and expansion devices.",
        "Storage devices retain data, while memory provides fast temporary workspace."
      ], "Hardware knowledge helps learners understand performance, repair, and device selection.", "labeled motherboard, CPU, or full computer teardown model"),
      collapseSoftware: topic("Computer Software", [
        "Software is a set of instructions that tells hardware what to do.",
        "System software manages hardware resources and provides a platform for applications.",
        "Application software helps users perform tasks such as writing, browsing, designing, or calculating.",
        "Software updates can fix security issues, improve performance, or add features."
      ], "Software explains how human instructions become computer actions.", "software stack or application architecture model"),
      collapseOS: topic("Operating Systems", [
        "An operating system manages hardware, software, files, memory, and user interaction.",
        "Common operating systems include Windows, macOS, Linux, Android, and iOS.",
        "The OS schedules processes and allocates system resources.",
        "File systems organize data into files, folders, metadata, and storage locations."
      ], "Operating systems are the control layer between users, applications, and hardware.", "OS layered architecture or process scheduling model"),
      collapseMemory: topic("Computer Memory", [
        "Memory stores data and instructions needed by the computer.",
        "RAM is volatile and fast, while storage is nonvolatile and usually slower.",
        "Cache memory is very fast memory used to reduce CPU waiting time.",
        "Binary data is represented using bits, with bytes commonly made of eight bits."
      ], "Memory concepts explain speed, multitasking, storage limits, and performance bottlenecks.", "memory hierarchy or binary storage model"),
      collapseNetworks: topic("Computer Networks", [
        "A network connects devices so they can share data, resources, and services.",
        "Network types include LANs, WANs, PANs, and the internet.",
        "Routers direct traffic between networks, while switches connect devices within a network.",
        "Protocols such as TCP/IP define how data is addressed, transmitted, and received."
      ], "Networks explain how devices communicate locally and globally.", "LAN topology, packet routing, or router-switch model"),
      collapseInternet: topic("Internet Basics", [
        "The internet is a global network of interconnected networks using standard protocols.",
        "Web pages are delivered through the World Wide Web using browsers and web servers.",
        "DNS translates human-readable domain names into IP addresses.",
        "Cloud services use remote servers to store, process, and deliver data over the internet."
      ], "Internet basics help learners understand browsing, hosting, communication, and online safety.", "DNS lookup, client-server, or packet journey model"),
      collapseSecurity: topic("Computer Security", [
        "Computer security protects systems, data, and users from unauthorized access or harm.",
        "Threats include malware, phishing, weak passwords, social engineering, and insecure networks.",
        "Encryption protects data by transforming it into unreadable form without the correct key.",
        "Good security uses layers such as updates, backups, authentication, and user awareness."
      ], "Security knowledge reduces risk and builds safer digital habits.", "encryption flow, firewall, or phishing attack pathway model"),
      collapsePeripherals: topic("Computer Peripherals", [
        "Peripherals are external or auxiliary devices connected to a computer.",
        "Input devices include keyboards, mice, scanners, microphones, and cameras.",
        "Output devices include monitors, printers, speakers, and projectors.",
        "Some peripherals, such as touchscreens and external drives, support both input and output functions."
      ], "Peripherals show how computers connect with users and the physical world.", "input/output device map or port connection model"),
      collapseFuture: topic("Future Technologies", [
        "Emerging technologies include artificial intelligence, quantum computing, augmented reality, robotics, and edge computing.",
        "AI systems use data and algorithms to recognize patterns, make predictions, or generate outputs.",
        "Quantum computing uses quantum states such as superposition and entanglement for specialized computation.",
        "Ethics, privacy, access, and sustainability are major concerns in future technology design."
      ], "Future technologies help learners connect computing basics to innovation and society.", "AI pipeline, quantum bit, robot sensor, or AR overlay model")
    },
    "3dculture.html": {
      collapseOne: topic("Introduction to World Cultures", [
        "Culture includes shared knowledge, beliefs, values, customs, language, art, and social practices.",
        "Cultures are dynamic and change through migration, trade, innovation, conflict, and exchange.",
        "Material culture includes objects and spaces; nonmaterial culture includes ideas, norms, and traditions.",
        "Respectful cultural study avoids stereotypes and considers historical context."
      ], "World cultures help learners understand human diversity and shared social patterns.", "global culture map or material versus nonmaterial culture model"),
      collapseTwo: topic("African Cultures and Traditions", [
        "Africa contains thousands of ethnic groups and languages with diverse histories and traditions.",
        "Oral traditions, music, dance, textiles, masks, and sculpture often preserve memory and identity.",
        "Kinship, community roles, and rites of passage are important in many African societies.",
        "Trade routes, kingdoms, colonialism, and independence movements shaped modern African cultures."
      ], "African cultural study shows diversity within a large continent and the importance of context.", "African mask, textile pattern, homestead, or trade route model"),
      collapseThree: topic("Asian Traditions and Customs", [
        "Asia includes many cultural regions with distinct religions, languages, philosophies, and artistic traditions.",
        "Major belief systems such as Hinduism, Buddhism, Confucianism, Taoism, Islam, and Christianity influenced societies.",
        "Family structures, festivals, foodways, architecture, and calligraphy vary widely across Asia.",
        "Trade routes such as the Silk Road helped spread goods, ideas, technologies, and religions."
      ], "Asian traditions illustrate cultural exchange across long historical networks.", "temple architecture, Silk Road map, or festival artifact model"),
      collapseFour: topic("European Heritage and Arts", [
        "European cultures were shaped by ancient civilizations, Christianity, regional kingdoms, trade, and migration.",
        "Art movements such as Classical, Gothic, Renaissance, Baroque, Romantic, and Modern styles reflect changing ideas.",
        "European languages include Romance, Germanic, Slavic, Celtic, and other language families.",
        "Museums, architecture, literature, and music preserve many forms of European heritage."
      ], "European heritage connects history, art, language, and social change.", "cathedral, amphitheater, sculpture, or art timeline model"),
      collapseFive: topic("North American Indigenous Cultures", [
        "Indigenous peoples of North America include many nations with distinct languages, lands, and traditions.",
        "Cultural practices are closely connected to place, ecology, oral history, and community responsibility.",
        "Art forms include beadwork, carving, weaving, pottery, storytelling, music, and ceremonial objects.",
        "Colonization, forced removal, and assimilation policies deeply affected Indigenous communities, but cultural continuity remains strong."
      ], "This topic requires accuracy and respect for living communities and sovereignty.", "dwelling types, beadwork, canoe, or territory map model"),
      collapseSix: topic("South American Indigenous and Folk Cultures", [
        "South America includes Indigenous nations and mixed cultural traditions shaped by local histories and environments.",
        "Andean civilizations developed complex agriculture, textiles, roads, and architecture.",
        "Amazonian cultures often hold deep ecological knowledge of forests, rivers, and biodiversity.",
        "Music, dance, festivals, weaving, and oral traditions preserve identity across generations."
      ], "South American cultures show strong links between environment, history, and community identity.", "Andean terrace, textile, pan flute, or Amazon settlement model"),
      collapseSeven: topic("Food Culture and Culinary Traditions", [
        "Food culture includes ingredients, cooking methods, meal customs, symbolism, and social rules around eating.",
        "Geography affects cuisine through climate, crops, livestock, water access, and trade routes.",
        "Food can express identity, celebration, religion, migration, and economic history.",
        "Culinary traditions change over time through exchange, adaptation, and innovation."
      ], "Food is a practical way to understand geography, history, and identity.", "regional food map, crop origin, or cooking tool model"),
      collapseEight: topic("Traditional Clothing and Textiles", [
        "Clothing can communicate climate adaptation, identity, social role, occupation, belief, and status.",
        "Textile traditions include weaving, dyeing, embroidery, beadwork, printing, and leatherwork.",
        "Materials such as cotton, wool, silk, bark cloth, and plant fibers reflect local resources and trade.",
        "Traditional clothing may be everyday wear, ceremonial dress, or heritage clothing used for special occasions."
      ], "Textiles connect art, technology, environment, and social meaning.", "loom, textile weave, garment layers, or dye process model"),
      collapseNine: topic("Ceremonial Artifacts and Ritual Objects", [
        "Ceremonial artifacts are objects used in rituals, rites of passage, worship, remembrance, or community events.",
        "Meaning depends on cultural context, not only the object's appearance.",
        "Some ritual objects are sacred or restricted and should not be copied or displayed without permission.",
        "Materials, craftsmanship, symbols, and use reveal relationships between belief, identity, and community."
      ], "This topic teaches careful interpretation and respect for cultural ownership.", "ritual object display with contextual labels"),
      collapseTen: topic("Folklore, Myths, and Oral Traditions", [
        "Oral traditions pass knowledge, values, history, humor, and warnings through spoken performance.",
        "Folklore includes legends, myths, proverbs, songs, riddles, epics, and folktales.",
        "Stories often explain origins, teach behavior, preserve memory, or strengthen group identity.",
        "Oral traditions change with each performance while preserving important cultural patterns."
      ], "Folklore shows how communities remember, teach, and imagine the world.", "story map, oral performance setting, or myth timeline model")
    },
    "3dgeo.html": {
      collapseOne: topic("Earth's Natural Systems", [
        "Physical geography studies natural systems such as landforms, climate, water, soils, and ecosystems.",
        "Earth's surface is shaped by internal forces such as tectonics and external forces such as weathering and erosion.",
        "The water cycle moves water through evaporation, condensation, precipitation, infiltration, runoff, and storage.",
        "Biomes form through interactions among climate, landforms, soil, water, and living organisms."
      ], "Physical geography explains the landscapes and natural processes around us.", "plate tectonics, river basin, landform, or water cycle model"),
      collapseTwo: topic("People and Their Environments", [
        "Human geography studies population, settlement, culture, economies, politics, and movement across space.",
        "Population distribution is influenced by climate, resources, jobs, transport, history, and government policy.",
        "Urbanization changes land use, infrastructure, services, and environmental pressures.",
        "Migration can be driven by push factors such as conflict and pull factors such as jobs or safety."
      ], "Human geography explains how people organize space and interact with places.", "city growth, migration flow, or settlement pattern model"),
      collapseThree: topic("Human-Environment Interaction", [
        "Human-environment interaction studies how people use, adapt to, and modify natural systems.",
        "Resource extraction, farming, urban growth, and transport can alter land, water, air, and biodiversity.",
        "Sustainable development aims to meet current needs while protecting future options.",
        "Hazard management reduces risk through planning, warning systems, engineering, and education."
      ], "This topic links environmental decisions to real social and ecological outcomes.", "land-use change, watershed impact, or hazard risk model"),
      collapseFour: topic("Geographic Techniques", [
        "Geographic techniques include maps, fieldwork, remote sensing, GPS, and geographic information systems.",
        "Maps use scale, symbols, coordinates, and projection to represent places.",
        "Remote sensing gathers information from satellites, aircraft, or drones.",
        "GIS stores, analyzes, and displays spatial data in layers."
      ], "Geographic tools help learners measure, compare, and explain spatial patterns.", "GIS layer stack, map projection, or GPS triangulation model"),
      collapseFive: topic("World Regions and Characteristics", [
        "Regional geography studies areas with shared physical, cultural, economic, or political characteristics.",
        "Regions can be formal, functional, or perceptual depending on how they are defined.",
        "World regions are shaped by climate, landforms, resources, population, history, and trade.",
        "Comparing regions helps explain similarities, differences, and connections among places."
      ], "Regional geography gives learners a structured way to understand the world.", "interactive world regions map"),
      collapseSix: topic("Climate Systems", [
        "Climate is the long-term pattern of weather conditions in a region.",
        "Atmospheric circulation redistributes heat and moisture around Earth.",
        "Latitude, altitude, ocean currents, winds, and distance from the sea affect climate.",
        "Climate change refers to long-term shifts in climate patterns, including changes driven by greenhouse gases."
      ], "Climate systems explain weather patterns, ecosystems, agriculture, and hazards.", "atmospheric circulation, greenhouse effect, or climate zone model")
    },
    "3dphysics.html": {
      collapseOne: topic("Classical Mechanics", [
        "Classical mechanics describes motion, forces, energy, and momentum for everyday-scale objects.",
        "Velocity measures change in position over time, while acceleration measures change in velocity.",
        "Newton's laws relate force, mass, acceleration, and interactions between objects.",
        "Energy and momentum conservation are powerful tools for analyzing motion."
      ], "Mechanics explains vehicles, sports, machines, structures, and planetary motion.", "force diagram, projectile path, pulley, or Newton's cradle model"),
      collapseTwo: topic("Thermodynamics", [
        "Thermodynamics studies heat, temperature, work, and energy transfer.",
        "Temperature relates to average particle kinetic energy, while heat is energy transferred due to temperature difference.",
        "The first law of thermodynamics expresses conservation of energy.",
        "The second law describes entropy increase and limits on heat engine efficiency."
      ], "Thermodynamics explains engines, refrigerators, weather, and biological energy flow.", "heat engine, particle motion, or energy transfer model"),
      collapseThree: topic("Electromagnetism", [
        "Electromagnetism studies electric charges, electric fields, magnetic fields, and electromagnetic waves.",
        "Electric current is the flow of charge through a conductor or circuit.",
        "Changing magnetic fields can induce electric currents, and currents can create magnetic fields.",
        "Electromagnetic forces are responsible for circuits, motors, generators, and light."
      ], "Electromagnetism connects electricity, magnetism, communication, and modern devices.", "electric field lines, circuit, motor, or generator model"),
      collapseFour: topic("Optics and Light", [
        "Optics studies light behavior, including reflection, refraction, diffraction, and interference.",
        "Reflection occurs when light bounces from a surface, while refraction occurs when light changes speed and direction in a new medium.",
        "Lenses form images by refracting light, and mirrors form images by reflection.",
        "Light can be modeled as rays for many optical systems and as waves for interference effects."
      ], "Optics explains vision, cameras, microscopes, telescopes, and fiber optics.", "lens ray diagram, prism, mirror, or eye model"),
      collapseFive: topic("Modern Physics", [
        "Modern physics includes relativity, quantum theory, atomic physics, and particle physics.",
        "Special relativity describes how measurements of time and space depend on relative motion at high speeds.",
        "Quantum theory describes energy and matter at atomic and subatomic scales.",
        "Atoms emit or absorb light at specific energies related to electron transitions."
      ], "Modern physics explains phenomena that classical physics cannot fully describe.", "atomic orbitals, quantum energy levels, or spacetime model"),
      collapseSix: topic("Waves and Acoustics", [
        "Waves transfer energy through matter or space without permanently transporting matter.",
        "Wave properties include wavelength, frequency, amplitude, speed, and period.",
        "Sound is a mechanical longitudinal wave that requires a medium.",
        "Interference, resonance, reflection, and diffraction shape wave behavior."
      ], "Wave physics explains sound, music, earthquakes, communication, and imaging.", "wave interference, standing wave, or sound wave model"),
      collapseSeven: topic("Nuclear Physics", [
        "Nuclear physics studies atomic nuclei and the forces that hold protons and neutrons together.",
        "Radioactive decay changes unstable nuclei by emitting radiation.",
        "Fission splits heavy nuclei and can release large amounts of energy.",
        "Fusion combines light nuclei and powers stars, including the Sun."
      ], "Nuclear physics explains radiation, nuclear energy, medical imaging, and stars.", "nuclear decay, reactor core, or fusion model"),
      collapseEight: topic("Fluid Mechanics", [
        "Fluid mechanics studies liquids and gases at rest and in motion.",
        "Pressure in a fluid depends on force per unit area and often increases with depth.",
        "Buoyancy results from pressure differences and explains why objects float or sink.",
        "Flow behavior depends on viscosity, speed, density, and boundary conditions."
      ], "Fluid mechanics explains weather, blood flow, flight, plumbing, and ships.", "fluid flow, buoyancy, or airfoil model"),
      collapseNine: topic("Solid State Physics", [
        "Solid state physics studies the structure and properties of solid materials.",
        "Crystal lattices arrange atoms or ions in repeating patterns.",
        "Electrical behavior differs among conductors, semiconductors, and insulators.",
        "Material properties depend on bonding, defects, temperature, and microstructure."
      ], "Solid state physics supports electronics, materials science, and nanotechnology.", "crystal lattice, semiconductor band gap, or material defect model"),
      collapseTen: topic("Astrophysics and Cosmology", [
        "Astrophysics applies physics to stars, planets, galaxies, black holes, and other objects in space.",
        "Gravity shapes orbits, star formation, galaxy structure, and large-scale cosmic motion.",
        "Stars produce energy mainly through nuclear fusion in their cores.",
        "Cosmology studies the origin, structure, evolution, and large-scale properties of the universe."
      ], "Astrophysics connects physics to the largest structures and histories in the universe.", "solar system, star life cycle, galaxy, or spacetime curvature model")
    }
  };

  function topic(title, notes, why, model) {
    return { title:title, notes:notes, why:why, model:model };
  }

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }
    callback();
  }

  function pageName() {
    return (window.location.pathname.split("/").pop() || "").toLowerCase();
  }

  function icon(name) {
    var i = document.createElement("i");
    i.className = "fas " + name;
    i.setAttribute("aria-hidden", "true");
    return i;
  }

  function getDirectBody(collapse) {
    return Array.prototype.slice.call(collapse.children).find(function (child) {
      return child.classList && child.classList.contains("accordion-body");
    });
  }

  function createExpansion(id, entry) {
    var wrap = document.createElement("section");
    wrap.className = "soma-topic-expansion";
    wrap.setAttribute("data-soma-topic-notes", id);

    var kicker = document.createElement("div");
    kicker.className = "soma-topic-kicker";
    kicker.appendChild(icon("fa-book-open"));
    kicker.appendChild(document.createTextNode(" Study notes and 3D model space"));

    var grid = document.createElement("div");
    grid.className = "soma-topic-grid";

    var notes = document.createElement("article");
    notes.className = "soma-note-card";
    var notesTitle = document.createElement("h5");
    notesTitle.textContent = entry.title + " - factual notes";
    var list = document.createElement("ul");
    list.className = "soma-note-list";
    entry.notes.forEach(function (note) {
      var li = document.createElement("li");
      li.textContent = note;
      list.appendChild(li);
    });
    var why = document.createElement("p");
    why.className = "soma-why";
    why.textContent = entry.why;
    notes.appendChild(notesTitle);
    notes.appendChild(list);
    notes.appendChild(why);

    var model = document.createElement("aside");
    model.className = "soma-model-slot";
    var modelHeader = document.createElement("div");
    modelHeader.className = "soma-model-slot-header";
    var modelTitle = document.createElement("h5");
    modelTitle.textContent = "3D model space";
    var modelHint = document.createElement("p");
    modelHint.className = "soma-model-hint";
    modelHint.textContent = "Best model to add: " + entry.model + ".";
    modelHeader.appendChild(modelTitle);
    modelHeader.appendChild(modelHint);

    var stage = document.createElement("div");
    stage.className = "soma-model-stage";
    stage.appendChild(icon("fa-cube"));
    var stageText = document.createElement("div");
    stageText.textContent = "Paste a Sketchfab embed here or use the data-model-src shortcut.";
    var code = document.createElement("code");
    code.className = "soma-model-code";
    code.textContent = '<div class="model-container" data-model-title="' + entry.title + '" data-model-src="https://sketchfab.com/models/MODEL_ID/embed"></div>';
    stage.appendChild(stageText);
    stage.appendChild(code);

    model.appendChild(modelHeader);
    model.appendChild(stage);
    grid.appendChild(notes);
    grid.appendChild(model);
    wrap.appendChild(kicker);
    wrap.appendChild(grid);
    return wrap;
  }

  function injectNotes() {
    var data = DATA[pageName()];
    if (!data) return;

    Object.keys(data).forEach(function (id) {
      var collapse = document.getElementById(id);
      if (!collapse || collapse.querySelector('[data-soma-topic-notes="' + id + '"]')) return;
      var body = getDirectBody(collapse);
      if (!body) return;
      body.appendChild(createExpansion(id, data[id]));
    });

    document.body.classList.add("soma-notes-ready");
    if (window.SomaModels && typeof window.SomaModels.mountAll === "function") {
      window.SomaModels.mountAll(document);
    }
  }

  ready(injectNotes);
}());
