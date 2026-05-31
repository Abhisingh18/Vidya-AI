// Extended reel library — appended to the curated core set in shorts.ts.
// Visual archetypes are auto-picked by subject/id in reel-scene.ts.
import type { Short } from './shorts';

export const EXTRA_SHORTS: Short[] = [
  // ═══════════════════ MATHEMATICS ═══════════════════
  { id: 'exponents', topic: 'Exponents', subject: 'Mathematics', language: 'English', emoji: '🔢', accent: 'saffron', hook: 'Powers made easy 🔢', beats: [
    { big: '2³ = 8', say: 'Two cubed means two times two times two — that’s eight.' },
    { big: 'aᵐ · aⁿ = aᵐ⁺ⁿ', say: 'Multiplying same bases? Just add the exponents.' },
    { big: 'a⁰ = 1', say: 'Anything to the power zero equals one.' },
    { big: 'a⁻¹ = 1/a', say: 'A negative power means one over the number.' },
  ]},
  { id: 'square-roots', topic: 'Square Roots', subject: 'Mathematics', language: 'English', emoji: '√', accent: 'indigo', hook: 'Undo a square √', beats: [
    { big: '√49 = 7', say: 'A square root asks: what number times itself gives this?' },
    { big: '7 × 7 = 49', say: 'Seven times seven is forty-nine, so root forty-nine is seven.' },
    { big: '√2 ≈ 1.414', say: 'Some roots are irrational and never end.' },
    { big: 'Perfect squares 🟦', say: 'Memorise 1, 4, 9, 16, 25 to spot them fast.' },
  ]},
  { id: 'hcf-lcm', topic: 'HCF and LCM', subject: 'Mathematics', language: 'English', emoji: '🔗', accent: 'teal', hook: 'Two sides of one coin 🔗', beats: [
    { big: 'HCF = biggest shared', say: 'HCF is the largest number that divides both.' },
    { big: 'LCM = smallest common', say: 'LCM is the smallest number both divide into.' },
    { big: 'HCF × LCM = a × b', say: 'Their product equals the product of the two numbers.' },
    { big: '12 & 18 → 6, 36', say: 'For 12 and 18: HCF is six, LCM is thirty-six.' },
  ]},
  { id: 'fractions', topic: 'Adding Fractions', subject: 'Mathematics', language: 'English', emoji: '🍕', accent: 'saffron', hook: 'Pizza maths 🍕', beats: [
    { big: '1/2 + 1/3', say: 'You can’t add fractions with different bottoms directly.' },
    { big: 'LCD = 6', say: 'Find a common denominator — here it’s six.' },
    { big: '3/6 + 2/6', say: 'Rewrite both with six on the bottom.' },
    { big: '= 5/6 ✅', say: 'Now just add the tops — five sixths.' },
  ]},
  { id: 'simple-interest', topic: 'Simple Interest', subject: 'Mathematics', language: 'English', emoji: '🏦', accent: 'indigo', hook: 'Your money grows 🏦', beats: [
    { big: 'SI = P·R·T/100', say: 'Simple interest uses principal, rate, and time.' },
    { big: '₹1000, 5%, 2yr', say: 'A thousand rupees at five percent for two years.' },
    { big: '1000×5×2/100', say: 'Plug the numbers into the formula.' },
    { big: '= ₹100', say: 'You earn a hundred rupees in interest.' },
  ]},
  { id: 'profit-loss', topic: 'Profit & Loss', subject: 'Mathematics', language: 'English', emoji: '💵', accent: 'teal', hook: 'Shopkeeper maths 💵', beats: [
    { big: 'Profit = SP − CP', say: 'Profit is selling price minus cost price.' },
    { big: 'CP ₹80, SP ₹100', say: 'Buy at eighty, sell at a hundred.' },
    { big: 'Profit = ₹20', say: 'That’s a twenty rupee profit.' },
    { big: 'Profit% = 25%', say: 'As a percent of cost, that’s twenty-five percent.' },
  ]},
  { id: 'mensuration', topic: 'Volume of a Cylinder', subject: 'Mathematics', language: 'English', emoji: '🥫', accent: 'saffron', hook: 'How much fits inside? 🥫', beats: [
    { big: 'V = πr²h', say: 'A cylinder’s volume is pi times radius squared times height.' },
    { big: 'circle × height', say: 'It’s just the circular base stacked up to the height.' },
    { big: 'r=7, h=10', say: 'For radius seven and height ten…' },
    { big: '≈ 1540 cm³', say: 'You get about fifteen hundred cubic centimetres.' },
  ]},
  { id: 'sphere-volume', topic: 'Volume of a Sphere', subject: 'Mathematics', language: 'English', emoji: '⚽', accent: 'indigo', hook: 'Ball maths ⚽', beats: [
    { big: 'V = (4/3)πr³', say: 'A sphere’s volume is four-thirds pi r cubed.' },
    { big: 'r = 3', say: 'Take a radius of three.' },
    { big: '(4/3)π·27', say: 'Cube the radius and multiply.' },
    { big: '≈ 113 units³', say: 'That gives about a hundred thirteen cubic units.' },
  ]},
  { id: 'angles', topic: 'Types of Angles', subject: 'Mathematics', language: 'English', emoji: '📐', accent: 'teal', hook: 'Know your angles 📐', beats: [
    { big: '< 90° acute', say: 'An acute angle is less than ninety degrees.' },
    { big: '= 90° right', say: 'A right angle is exactly ninety degrees.' },
    { big: '> 90° obtuse', say: 'An obtuse angle is more than ninety, less than one-eighty.' },
    { big: '= 180° straight', say: 'A straight angle is a flat line — one-eighty degrees.' },
  ]},
  { id: 'triangle-angles', topic: 'Angle Sum of Triangle', subject: 'Mathematics', language: 'English', emoji: '📐', accent: 'saffron', hook: 'A triangle’s secret sum 📐', beats: [
    { big: '∠A+∠B+∠C', say: 'Add all three angles of any triangle.' },
    { big: '= 180°', say: 'They always sum to exactly one hundred eighty degrees.' },
    { big: 'always! 🔺', say: 'Big or small, this never changes.' },
    { big: '60+60+60', say: 'An equilateral triangle has three sixty-degree angles.' },
  ]},
  { id: 'linear-eq', topic: 'Linear Equations', subject: 'Mathematics', language: 'English', emoji: '➗', accent: 'indigo', hook: 'Solve for x ➗', beats: [
    { big: '2x + 3 = 11', say: 'We want to find the value of x.' },
    { big: '2x = 8', say: 'Subtract three from both sides.' },
    { big: 'x = 4', say: 'Divide both sides by two.' },
    { big: 'Check ✅', say: 'Two times four plus three is eleven. Correct!' },
  ]},
  { id: 'ap', topic: 'Arithmetic Progression', subject: 'Mathematics', language: 'English', emoji: '📈', accent: 'teal', hook: 'Numbers in a pattern 📈', beats: [
    { big: '2,5,8,11…', say: 'Each term increases by a fixed amount.' },
    { big: 'd = 3', say: 'Here the common difference is three.' },
    { big: 'aₙ = a + (n-1)d', say: 'The nth term uses the first term and the difference.' },
    { big: 'Sₙ = n/2(a+l)', say: 'And the sum is n over two times first plus last.' },
  ]},
  { id: 'polynomials', topic: 'Polynomials', subject: 'Mathematics', language: 'English', emoji: '🧮', accent: 'saffron', hook: 'Expressions with powers 🧮', beats: [
    { big: 'x² + 3x + 2', say: 'A polynomial is a sum of terms with whole-number powers.' },
    { big: 'degree = 2', say: 'The highest power is its degree — here two.' },
    { big: '(x+1)(x+2)', say: 'It factors into two simpler brackets.' },
    { big: 'roots: -1, -2', say: 'Set each bracket to zero to find the roots.' },
  ]},
  { id: 'sets', topic: 'Sets & Venn Diagrams', subject: 'Mathematics', language: 'English', emoji: '⭕', accent: 'indigo', hook: 'Grouping made visual ⭕', beats: [
    { big: 'A ∪ B', say: 'Union means everything in either set.' },
    { big: 'A ∩ B', say: 'Intersection means only what’s in both.' },
    { big: 'Venn diagram', say: 'Overlapping circles show it perfectly.' },
    { big: 'n(A∪B)=n(A)+n(B)−n(A∩B)', say: 'Add the sets, then subtract the overlap once.' },
  ]},
  { id: 'mean-deviation', topic: 'Standard Deviation', subject: 'Mathematics', language: 'English', emoji: '📊', accent: 'teal', hook: 'How spread out is data? 📊', beats: [
    { big: 'σ', say: 'Standard deviation measures how spread out values are.' },
    { big: 'small σ = tight', say: 'A small sigma means data hugs the average.' },
    { big: 'big σ = scattered', say: 'A big sigma means values are spread far apart.' },
    { big: 'σ² = variance', say: 'Square the deviation and you get the variance.' },
  ]},
  { id: 'matrices', topic: 'Matrices', subject: 'Mathematics', language: 'English', emoji: '🔲', accent: 'saffron', hook: 'Numbers in a grid 🔲', beats: [
    { big: '[2 1; 0 3]', say: 'A matrix is just numbers arranged in rows and columns.' },
    { big: '2×2 size', say: 'This one has two rows and two columns.' },
    { big: 'A × B ≠ B × A', say: 'Matrix multiplication order matters.' },
    { big: 'Powers graphics 🎮', say: 'They run 3D graphics, AI, and physics engines.' },
  ]},
  { id: 'limits', topic: 'Limits', subject: 'Mathematics', language: 'English', emoji: '➡️', accent: 'indigo', hook: 'Getting infinitely close ➡️', beats: [
    { big: 'lim x→2', say: 'A limit asks what a function approaches near a point.' },
    { big: 'not always = f(2)', say: 'It’s about the journey, not just the destination.' },
    { big: 'foundation of calculus', say: 'Limits make derivatives and integrals possible.' },
    { big: '1/x → 0', say: 'As x grows huge, one over x creeps toward zero.' },
  ]},
  { id: 'binomial', topic: 'Binomial Theorem', subject: 'Mathematics', language: 'English', emoji: '🔺', accent: 'teal', hook: 'Expand without pain 🔺', beats: [
    { big: '(a+b)²', say: 'Expanding brackets by hand gets tedious fast.' },
    { big: '= a²+2ab+b²', say: 'But there’s a pattern to the coefficients.' },
    { big: 'Pascal’s triangle', say: 'The coefficients come straight from Pascal’s triangle.' },
    { big: 'ⁿCᵣ', say: 'Each term uses a combination — n choose r.' },
  ]},
  { id: 'probability-coin', topic: 'Coin Probability', subject: 'Mathematics', language: 'English', emoji: '🪙', accent: 'saffron', hook: 'Heads or tails? 🪙', beats: [
    { big: 'P(head) = 1/2', say: 'A fair coin has equal chance of heads or tails.' },
    { big: '2 coins → 4 ways', say: 'Two coins give four equally likely outcomes.' },
    { big: 'P(2 heads)=1/4', say: 'Only one of four is double heads.' },
    { big: 'Past ≠ future', say: 'Ten heads in a row? Next flip is still fifty-fifty.' },
  ]},
  { id: 'ratio', topic: 'Ratio & Proportion', subject: 'Mathematics', language: 'English', emoji: '⚖️', accent: 'indigo', hook: 'Compare like a pro ⚖️', beats: [
    { big: '2 : 3', say: 'A ratio compares two quantities.' },
    { big: '= 4 : 6', say: 'Multiply both sides and the ratio stays the same.' },
    { big: 'a/b = c/d', say: 'A proportion says two ratios are equal.' },
    { big: 'cross-multiply ✖️', say: 'Cross-multiply to solve for the missing value.' },
  ]},

  // ═══════════════════ PHYSICS ═══════════════════
  { id: 'equations-motion', topic: 'Equations of Motion', subject: 'Physics', language: 'English', emoji: '🏃', accent: 'indigo', hook: 'Predict any motion 🏃', beats: [
    { big: 'v = u + at', say: 'Final velocity equals initial plus acceleration times time.' },
    { big: 's = ut + ½at²', say: 'Distance uses initial speed and acceleration.' },
    { big: 'v² = u² + 2as', say: 'And this links velocity to distance.' },
    { big: '3 golden formulas', say: 'These three solve almost any motion problem.' },
  ]},
  { id: 'projectile', topic: 'Projectile Motion', subject: 'Physics', language: 'English', emoji: '🏹', accent: 'saffron', hook: 'Why everything curves 🏹', beats: [
    { big: '→ + ↓', say: 'A projectile moves forward and falls at the same time.' },
    { big: 'parabola path', say: 'Together they trace a perfect parabola.' },
    { big: '45° = max range', say: 'Launch at forty-five degrees for the longest throw.' },
    { big: 'gravity only ↓', say: 'Gravity only pulls down, never sideways.' },
  ]},
  { id: 'circular-motion', topic: 'Circular Motion', subject: 'Physics', language: 'English', emoji: '🎡', accent: 'teal', hook: 'Why you feel pushed out 🎡', beats: [
    { big: 'a = v²/r', say: 'Moving in a circle needs an inward acceleration.' },
    { big: 'centripetal force', say: 'A force must always pull toward the centre.' },
    { big: '🪢 string tension', say: 'Swing a ball — the string provides that force.' },
    { big: 'let go → straight', say: 'Release it and it flies off in a straight line.' },
  ]},
  { id: 'work-energy', topic: 'Work–Energy Theorem', subject: 'Physics', language: 'English', emoji: '💪', accent: 'indigo', hook: 'Work becomes energy 💪', beats: [
    { big: 'W = F·d', say: 'Work is force times distance moved.' },
    { big: 'W = ΔKE', say: 'The work done changes kinetic energy.' },
    { big: 'No motion = no work', say: 'Push a wall all day — zero work in physics.' },
    { big: 'Unit: Joule', say: 'Both work and energy are measured in joules.' },
  ]},
  { id: 'energy-conservation', topic: 'Conservation of Energy', subject: 'Physics', language: 'English', emoji: '🎢', accent: 'saffron', hook: 'Energy never dies 🎢', beats: [
    { big: 'KE + PE = const', say: 'Total energy stays constant in a closed system.' },
    { big: '🎢 top = PE', say: 'At the top of a coaster, energy is all potential.' },
    { big: '🎢 bottom = KE', say: 'At the bottom it’s all kinetic — full speed.' },
    { big: 'just transforms 🔄', say: 'Energy only changes form, never disappears.' },
  ]},
  { id: 'archimedes', topic: 'Archimedes Principle', subject: 'Physics', language: 'English', emoji: '🛁', accent: 'teal', hook: 'Eureka! 🛁', beats: [
    { big: 'Buoyant force ↑', say: 'A fluid pushes up on anything placed in it.' },
    { big: '= weight of fluid', say: 'The push equals the weight of fluid displaced.' },
    { big: 'displaced 💧', say: 'Heavier than that water? You sink. Lighter? You float.' },
    { big: 'Ships & balloons', say: 'It explains floating ships and rising balloons.' },
  ]},
  { id: 'thermo-1', topic: '1st Law of Thermodynamics', subject: 'Physics', language: 'English', emoji: '🔥', accent: 'indigo', hook: 'Heat is energy 🔥', beats: [
    { big: 'ΔU = Q − W', say: 'Internal energy change equals heat added minus work done.' },
    { big: 'energy conserved', say: 'It’s energy conservation for heat systems.' },
    { big: '🔥 → ⚙️', say: 'Engines turn heat into useful work.' },
    { big: 'no free energy', say: 'You can’t create energy from nothing.' },
  ]},
  { id: 'specific-heat', topic: 'Specific Heat', subject: 'Physics', language: 'English', emoji: '🌡️', accent: 'saffron', hook: 'Why sand burns, sea stays cool 🌡️', beats: [
    { big: 'Q = mcΔT', say: 'Heat needed depends on mass, material, and temperature change.' },
    { big: 'water = high c', say: 'Water needs lots of heat to warm up.' },
    { big: 'sand = low c', say: 'Sand heats up fast with little energy.' },
    { big: 'beach proof 🏖️', say: 'That’s why beach sand burns but the sea feels cool.' },
  ]},
  { id: 'electric-field', topic: 'Electric Field', subject: 'Physics', language: 'English', emoji: '⚡', accent: 'indigo', hook: 'Invisible force fields ⚡', beats: [
    { big: 'E = F/q', say: 'An electric field is force per unit charge.' },
    { big: '+ pushes, − pulls', say: 'It points away from positive, toward negative charges.' },
    { big: 'field lines', say: 'We draw field lines to picture its direction.' },
    { big: 'powers everything 🔌', say: 'It’s behind every spark, screen, and circuit.' },
  ]},
  { id: 'capacitor', topic: 'Capacitors', subject: 'Physics', language: 'English', emoji: '🔋', accent: 'teal', hook: 'Tiny energy tanks 🔋', beats: [
    { big: 'Q = CV', say: 'Charge stored equals capacitance times voltage.' },
    { big: '⚡ stores charge', say: 'A capacitor holds electric charge for later.' },
    { big: '📸 camera flash', say: 'It dumps energy fast — like a camera flash.' },
    { big: 'two plates', say: 'It’s just two plates with a gap between them.' },
  ]},
  { id: 'em-induction', topic: 'Electromagnetic Induction', subject: 'Physics', language: 'English', emoji: '🔄', accent: 'indigo', hook: 'Magnets make electricity 🔄', beats: [
    { big: 'moving magnet 🧲', say: 'Move a magnet near a coil…' },
    { big: '→ current ⚡', say: 'and electric current appears in the wire.' },
    { big: 'Faraday’s law', say: 'A changing magnetic field induces voltage.' },
    { big: 'powers the grid 🏭', say: 'Every power plant works on this principle.' },
  ]},
  { id: 'lens', topic: 'Convex & Concave Lenses', subject: 'Physics', language: 'English', emoji: '🔍', accent: 'saffron', hook: 'Bending light to see 🔍', beats: [
    { big: 'Convex → converge', say: 'A convex lens bends light to a focal point.' },
    { big: 'Concave → diverge', say: 'A concave lens spreads light outward.' },
    { big: '👓 fix vision', say: 'Glasses use them to correct your eyesight.' },
    { big: '1/f = 1/v − 1/u', say: 'The lens formula links focus, image, and object.' },
  ]},
  { id: 'photoelectric', topic: 'Photoelectric Effect', subject: 'Physics', language: 'English', emoji: '☀️', accent: 'indigo', hook: 'Light kicks out electrons ☀️', beats: [
    { big: 'light → e⁻', say: 'Shine light on metal and electrons fly out.' },
    { big: 'E = hf', say: 'Light energy depends on frequency, not brightness.' },
    { big: 'Einstein 1905', say: 'Einstein explained it and won the Nobel Prize.' },
    { big: 'light = particles', say: 'It proved light behaves as particles called photons.' },
  ]},
  { id: 'radioactivity', topic: 'Radioactivity', subject: 'Physics', language: 'English', emoji: '☢️', accent: 'teal', hook: 'Unstable atoms decay ☢️', beats: [
    { big: 'α β γ', say: 'Unstable nuclei emit alpha, beta, or gamma rays.' },
    { big: 'half-life ⏳', say: 'Half-life is the time for half the atoms to decay.' },
    { big: 'carbon dating', say: 'It lets us date fossils thousands of years old.' },
    { big: '☢️ nuclear power', say: 'Controlled decay also generates electricity.' },
  ]},
  { id: 'nuclear', topic: 'Fission vs Fusion', subject: 'Physics', language: 'English', emoji: '⚛️', accent: 'indigo', hook: 'Power of the atom ⚛️', beats: [
    { big: 'Fission: split', say: 'Fission splits a heavy nucleus into smaller ones.' },
    { big: '☢️ nuclear plants', say: 'That’s how today’s nuclear reactors work.' },
    { big: 'Fusion: join', say: 'Fusion joins light nuclei into a heavier one.' },
    { big: '☀️ powers the Sun', say: 'Fusion is what makes the Sun shine.' },
  ]},
  { id: 'doppler', topic: 'The Doppler Effect', subject: 'Physics', language: 'English', emoji: '🚑', accent: 'saffron', hook: 'Why sirens change pitch 🚑', beats: [
    { big: 'approaching → high', say: 'A siren coming toward you sounds higher.' },
    { big: 'leaving → low', say: 'As it passes, the pitch suddenly drops.' },
    { big: 'waves squeeze 🌊', say: 'Motion squeezes or stretches the sound waves.' },
    { big: '🔭 redshift', say: 'The same effect shows galaxies racing away from us.' },
  ]},
  { id: 'pressure-fluid', topic: 'Pascal’s Law', subject: 'Physics', language: 'English', emoji: '🛢️', accent: 'teal', hook: 'Lift a car with one finger 🛢️', beats: [
    { big: 'P spreads equally', say: 'Pressure in a fluid spreads in all directions equally.' },
    { big: 'small push → big lift', say: 'A small force on a small piston lifts a big load.' },
    { big: '🚗 hydraulic jack', say: 'That’s how a hydraulic car jack works.' },
    { big: 'F₁/A₁ = F₂/A₂', say: 'Force over area stays the same on both sides.' },
  ]},

  // ═══════════════════ CHEMISTRY ═══════════════════
  { id: 'periodic-trends', topic: 'Periodic Trends', subject: 'Chemistry', language: 'English', emoji: '📋', accent: 'indigo', hook: 'Patterns in the table 📋', beats: [
    { big: '→ size shrinks', say: 'Across a period, atoms get smaller.' },
    { big: '↓ size grows', say: 'Down a group, atoms get bigger.' },
    { big: 'F most reactive', say: 'Fluorine is the most reactive non-metal.' },
    { big: 'predictable! 🔮', say: 'The table lets you predict an element’s behaviour.' },
  ]},
  { id: 'isotopes', topic: 'Isotopes', subject: 'Chemistry', language: 'English', emoji: '⚛️', accent: 'saffron', hook: 'Same element, different weight ⚛️', beats: [
    { big: 'same protons', say: 'Isotopes have the same number of protons.' },
    { big: 'different neutrons', say: 'But a different number of neutrons.' },
    { big: 'C-12, C-14', say: 'Carbon-12 and Carbon-14 are isotopes.' },
    { big: '🦴 carbon dating', say: 'Carbon-14 helps date ancient bones.' },
  ]},
  { id: 'electron-config', topic: 'Electron Shells', subject: 'Chemistry', language: 'English', emoji: '🪐', accent: 'teal', hook: 'Where electrons live 🪐', beats: [
    { big: '2, 8, 18…', say: 'Electrons fill shells in a fixed order.' },
    { big: 'inner first', say: 'The shell closest to the nucleus fills first.' },
    { big: 'outer = valence', say: 'The outermost electrons decide chemistry.' },
    { big: 'full = stable', say: 'A full outer shell makes an atom stable.' },
  ]},
  { id: 'gas-laws', topic: 'Boyle’s & Charles’s Law', subject: 'Chemistry', language: 'English', emoji: '🎈', accent: 'indigo', hook: 'Squeeze and heat a gas 🎈', beats: [
    { big: 'Boyle: PV = const', say: 'Squeeze a gas and its pressure rises.' },
    { big: 'P↑ → V↓', say: 'Pressure up, volume down — at constant temperature.' },
    { big: 'Charles: V ∝ T', say: 'Heat a gas and it expands.' },
    { big: '🎈 in the Sun', say: 'A balloon swells on a hot day — Charles’s law.' },
  ]},
  { id: 'electrolysis', topic: 'Electrolysis', subject: 'Chemistry', language: 'English', emoji: '🔌', accent: 'saffron', hook: 'Split with electricity 🔌', beats: [
    { big: '⚡ → split', say: 'Electricity can break a compound apart.' },
    { big: 'water → H₂ + O₂', say: 'It splits water into hydrogen and oxygen gas.' },
    { big: 'cathode −, anode +', say: 'Positive ions go to the negative electrode.' },
    { big: '⚙️ electroplating', say: 'It’s also used to coat metals like chrome and gold.' },
  ]},
  { id: 'catalyst', topic: 'Catalysts', subject: 'Chemistry', language: 'English', emoji: '⚗️', accent: 'teal', hook: 'Speed up without being used ⚗️', beats: [
    { big: 'speeds reaction ⚡', say: 'A catalyst makes a reaction go faster.' },
    { big: 'not consumed', say: 'It isn’t used up — it comes out unchanged.' },
    { big: 'lowers energy barrier', say: 'It gives reactants an easier path.' },
    { big: '🧬 enzymes', say: 'Enzymes are your body’s natural catalysts.' },
  ]},
  { id: 'equilibrium', topic: 'Chemical Equilibrium', subject: 'Chemistry', language: 'English', emoji: '⚖️', accent: 'indigo', hook: 'A reaction that goes both ways ⚖️', beats: [
    { big: 'A ⇌ B', say: 'Some reactions run forward and backward at once.' },
    { big: 'rates equal', say: 'At equilibrium both directions go at the same rate.' },
    { big: 'Le Chatelier', say: 'Disturb it and the system shifts to rebalance.' },
    { big: 'add heat → shift', say: 'Change temperature or pressure and it adjusts.' },
  ]},
  { id: 'organic', topic: 'Organic Chemistry Basics', subject: 'Chemistry', language: 'English', emoji: '🛢️', accent: 'saffron', hook: 'The chemistry of carbon 🛢️', beats: [
    { big: 'carbon = backbone', say: 'Carbon forms the skeleton of all organic molecules.' },
    { big: '4 bonds', say: 'Each carbon can make four strong bonds.' },
    { big: 'chains & rings', say: 'It builds long chains and rings of atoms.' },
    { big: 'life + fuel + plastic', say: 'It makes life, fuels, and plastics possible.' },
  ]},
  { id: 'hydrocarbons', topic: 'Hydrocarbons', subject: 'Chemistry', language: 'English', emoji: '🔥', accent: 'teal', hook: 'Just carbon & hydrogen 🔥', beats: [
    { big: 'CₙH₂ₙ₊₂', say: 'Alkanes follow this simple formula.' },
    { big: 'methane CH₄', say: 'Methane is the simplest hydrocarbon.' },
    { big: 'single/double/triple', say: 'Bonds can be single, double, or triple.' },
    { big: '⛽ fuels', say: 'They power your stove, car, and planes.' },
  ]},
  { id: 'corrosion', topic: 'Rusting & Corrosion', subject: 'Chemistry', language: 'English', emoji: '🔩', accent: 'indigo', hook: 'Why iron turns brown 🔩', beats: [
    { big: 'Fe + O₂ + H₂O', say: 'Iron reacts with oxygen and water.' },
    { big: '→ rust 🟤', say: 'The product is reddish-brown rust.' },
    { big: 'weakens metal', say: 'Rust eats away and weakens the iron.' },
    { big: '🎨 paint protects', say: 'Paint or galvanising keeps oxygen out.' },
  ]},
  { id: 'soap', topic: 'How Soap Cleans', subject: 'Chemistry', language: 'English', emoji: '🧼', accent: 'saffron', hook: 'The science of clean 🧼', beats: [
    { big: 'two ends', say: 'A soap molecule has a water-loving and oil-loving end.' },
    { big: '🛢️ grabs grease', say: 'The oily end grabs onto dirt and grease.' },
    { big: '💧 rinses away', say: 'The water end lets it wash off with water.' },
    { big: 'germs gone 🦠', say: 'That’s why soap is so good at cleaning.' },
  ]},
  { id: 'allotropes', topic: 'Allotropes of Carbon', subject: 'Chemistry', language: 'English', emoji: '💎', accent: 'teal', hook: 'Coal and diamond — same atom! 💎', beats: [
    { big: 'all carbon', say: 'Diamond and graphite are both pure carbon.' },
    { big: '💎 hardest', say: 'Diamond’s 3D bonds make it the hardest material.' },
    { big: '✏️ graphite soft', say: 'Graphite’s layers slide — great for pencils.' },
    { big: 'structure matters', say: 'Same atoms, different arrangement, opposite properties.' },
  ]},

  // ═══════════════════ BIOLOGY ═══════════════════
  { id: 'mitochondria', topic: 'Mitochondria', subject: 'Biology', language: 'English', emoji: '🔋', accent: 'teal', hook: 'The powerhouse of the cell 🔋', beats: [
    { big: 'makes ATP', say: 'Mitochondria produce ATP, the cell’s energy currency.' },
    { big: 'burns glucose 🍬', say: 'They burn glucose using oxygen.' },
    { big: 'own DNA 🧬', say: 'Strangely, they carry their own DNA.' },
    { big: 'more = more energy', say: 'Muscle cells are packed with them.' },
  ]},
  { id: 'respiration', topic: 'Cellular Respiration', subject: 'Biology', language: 'English', emoji: '🫁', accent: 'indigo', hook: 'How cells get energy 🫁', beats: [
    { big: 'glucose + O₂', say: 'Cells combine glucose with oxygen.' },
    { big: '→ CO₂ + H₂O + ATP', say: 'They release carbon dioxide, water, and energy.' },
    { big: 'reverse of 🌱', say: 'It’s basically photosynthesis run backward.' },
    { big: 'every cell, always', say: 'Every living cell does this non-stop.' },
  ]},
  { id: 'digestion', topic: 'Human Digestion', subject: 'Biology', language: 'English', emoji: '🍽️', accent: 'saffron', hook: 'From plate to cell 🍽️', beats: [
    { big: '👄 → 🫃', say: 'Digestion starts in the mouth with saliva.' },
    { big: 'stomach acid', say: 'The stomach breaks food down with acid.' },
    { big: 'small intestine', say: 'Nutrients are absorbed in the small intestine.' },
    { big: 'energy + waste', say: 'Useful bits fuel you; the rest is removed.' },
  ]},
  { id: 'neuron', topic: 'How Neurons Fire', subject: 'Biology', language: 'English', emoji: '⚡', accent: 'indigo', hook: 'Lightning in your head ⚡', beats: [
    { big: 'dendrites receive', say: 'Dendrites catch signals from other neurons.' },
    { big: '⚡ down the axon', say: 'An electrical pulse races down the axon.' },
    { big: 'synapse gap', say: 'At the gap, chemicals carry the message across.' },
    { big: '100 m/s 🏎️', say: 'Signals travel up to a hundred metres per second.' },
  ]},
  { id: 'blood-groups', topic: 'Blood Groups', subject: 'Biology', language: 'English', emoji: '🩸', accent: 'teal', hook: 'A, B, AB or O? 🩸', beats: [
    { big: 'A B AB O', say: 'There are four main blood groups.' },
    { big: 'O = universal donor', say: 'Group O can donate to everyone.' },
    { big: 'AB = universal receiver', say: 'Group AB can receive from everyone.' },
    { big: '± Rh factor', say: 'Each is also positive or negative for the Rh factor.' },
  ]},
  { id: 'kidney', topic: 'How Kidneys Work', subject: 'Biology', language: 'English', emoji: '🫘', accent: 'saffron', hook: 'Your body’s filter 🫘', beats: [
    { big: 'filters blood', say: 'Kidneys clean waste from your blood.' },
    { big: 'nephrons 🧪', say: 'Millions of tiny nephrons do the filtering.' },
    { big: '→ urine', say: 'Waste and extra water leave as urine.' },
    { big: '180 L/day!', say: 'They filter about a hundred eighty litres daily.' },
  ]},
  { id: 'enzymes', topic: 'Enzymes', subject: 'Biology', language: 'English', emoji: '🔑', accent: 'indigo', hook: 'Biological keys 🔑', beats: [
    { big: 'speed up reactions', say: 'Enzymes make body reactions happen fast.' },
    { big: '🔑 lock & key', say: 'Each enzyme fits one substrate like a key.' },
    { big: 'sensitive to heat', say: 'Too much heat destroys their shape.' },
    { big: 'amylase, pepsin', say: 'They digest your starch and protein.' },
  ]},
  { id: 'mendel', topic: 'Mendel’s Genetics', subject: 'Biology', language: 'English', emoji: '🟢', accent: 'teal', hook: 'Why you look like your parents 🟢', beats: [
    { big: 'genes in pairs', say: 'You get one gene copy from each parent.' },
    { big: 'dominant vs recessive', say: 'Dominant genes mask recessive ones.' },
    { big: '3 : 1 ratio', say: 'Mendel found traits appear in a three-to-one ratio.' },
    { big: '🌱 pea plants', say: 'He discovered it all by breeding pea plants.' },
  ]},
  { id: 'transpiration', topic: 'Transpiration', subject: 'Biology', language: 'English', emoji: '🌿', accent: 'indigo', hook: 'Plants sweat too 🌿', beats: [
    { big: '💧 leaves out', say: 'Plants lose water vapour through tiny leaf pores.' },
    { big: 'stomata', say: 'These pores are called stomata.' },
    { big: 'pulls water up ⬆️', say: 'It pulls water all the way up from the roots.' },
    { big: 'cools the plant', say: 'It also keeps the plant cool, like sweating.' },
  ]},
  { id: 'food-chain', topic: 'Food Chains', subject: 'Biology', language: 'English', emoji: '🦅', accent: 'teal', hook: 'Who eats whom? 🦅', beats: [
    { big: '🌱 → 🐛 → 🐦 → 🦅', say: 'Energy flows from plants up to predators.' },
    { big: 'producers first', say: 'Plants are the producers at the base.' },
    { big: '10% rule', say: 'Only a tenth of energy passes up each level.' },
    { big: 'all connected 🔗', say: 'Remove one link and the whole web suffers.' },
  ]},
  { id: 'immunity-types', topic: 'Vaccines', subject: 'Biology', language: 'English', emoji: '💉', accent: 'saffron', hook: 'Training your defences 💉', beats: [
    { big: 'weakened germ', say: 'A vaccine shows your body a harmless germ piece.' },
    { big: 'body learns 🧠', say: 'Your immune system learns to recognise it.' },
    { big: 'memory cells', say: 'It keeps memory cells ready for the real thing.' },
    { big: 'protected 🛡️', say: 'Next time, you fight it off before getting sick.' },
  ]},
  { id: 'evolution-2', topic: 'Natural Selection', subject: 'Biology', language: 'English', emoji: '🦎', accent: 'indigo', hook: 'Survival of the fittest 🦎', beats: [
    { big: 'random variation', say: 'Individuals naturally vary in their traits.' },
    { big: 'best survive', say: 'Those better suited survive and reproduce.' },
    { big: 'traits pass on', say: 'Helpful traits get passed to the next generation.' },
    { big: 'species change 🔄', say: 'Over time, the whole species adapts.' },
  ]},

  // ═══════════════════ COMPUTER SCIENCE ═══════════════════
  { id: 'bubble-sort', topic: 'Bubble Sort', subject: 'Computer Science', language: 'English', emoji: '🫧', accent: 'indigo', hook: 'The simplest sort 🫧', beats: [
    { big: 'compare pairs', say: 'Compare two neighbours at a time.' },
    { big: 'swap if wrong', say: 'Swap them if they’re out of order.' },
    { big: 'biggest bubbles up', say: 'The largest value floats to the end each pass.' },
    { big: 'O(n²) 🐌', say: 'Simple, but slow for big lists.' },
  ]},
  { id: 'stack-queue', topic: 'Stacks & Queues', subject: 'Computer Science', language: 'English', emoji: '🥞', accent: 'saffron', hook: 'Two ways to store data 🥞', beats: [
    { big: 'Stack = LIFO', say: 'A stack is last-in, first-out — like a pile of plates.' },
    { big: '↩️ undo button', say: 'Your undo button uses a stack.' },
    { big: 'Queue = FIFO', say: 'A queue is first-in, first-out — like a line.' },
    { big: '🖨️ print jobs', say: 'Printers handle jobs in a queue.' },
  ]},
  { id: 'oop', topic: 'Object-Oriented Programming', subject: 'Computer Science', language: 'English', emoji: '🧱', accent: 'teal', hook: 'Code like the real world 🧱', beats: [
    { big: 'Class = blueprint', say: 'A class is a blueprint, like “Car”.' },
    { big: 'Object = instance', say: 'An object is a real car built from it.' },
    { big: 'properties + methods', say: 'Objects have data and actions.' },
    { big: 'reuse & organise', say: 'It keeps big programs clean and reusable.' },
  ]},
  { id: 'logic-gates', topic: 'Logic Gates', subject: 'Computer Science', language: 'English', emoji: '🚪', accent: 'indigo', hook: 'The brain of every chip 🚪', beats: [
    { big: 'AND, OR, NOT', say: 'The basic gates are AND, OR, and NOT.' },
    { big: 'AND: both 1', say: 'AND outputs one only if both inputs are one.' },
    { big: 'OR: any 1', say: 'OR outputs one if any input is one.' },
    { big: 'build a CPU 🖥️', say: 'Combine millions and you get a processor.' },
  ]},
  { id: 'hashing', topic: 'Hashing', subject: 'Computer Science', language: 'English', emoji: '#️⃣', accent: 'saffron', hook: 'Instant lookups #️⃣', beats: [
    { big: 'key → hash → slot', say: 'A hash function turns a key into an address.' },
    { big: 'O(1) lookup ⚡', say: 'It finds data almost instantly.' },
    { big: 'collisions happen', say: 'Two keys can map to the same slot.' },
    { big: '🔐 passwords too', say: 'Hashing also stores passwords safely.' },
  ]},
  { id: 'database', topic: 'Databases & SQL', subject: 'Computer Science', language: 'English', emoji: '🗄️', accent: 'teal', hook: 'Where apps keep data 🗄️', beats: [
    { big: 'tables 📊', say: 'Data lives in tables of rows and columns.' },
    { big: 'SELECT * FROM', say: 'SQL queries pull out exactly what you need.' },
    { big: 'primary key 🔑', say: 'Each row has a unique key.' },
    { big: 'powers every app', say: 'From banks to social media — all use databases.' },
  ]},
  { id: 'ml-overfitting', topic: 'Overfitting in AI', subject: 'Computer Science', language: 'English', emoji: '🤖', accent: 'indigo', hook: 'When AI memorises too much 🤖', beats: [
    { big: 'learns the noise', say: 'An overfit model memorises training data exactly.' },
    { big: 'fails on new data', say: 'But it flops on examples it hasn’t seen.' },
    { big: 'too complex', say: 'Usually the model is too complex for the data.' },
    { big: 'fix: more data', say: 'More data and simpler models help fix it.' },
  ]},

  // ═══════════════════ GEOGRAPHY / GK / SCIENCE ═══════════════════
  { id: 'plate-tectonics', topic: 'Plate Tectonics', subject: 'General', language: 'English', emoji: '🌋', accent: 'saffron', hook: 'The ground is moving 🌋', beats: [
    { big: '🧩 moving plates', say: 'Earth’s crust is cracked into giant moving plates.' },
    { big: 'collide → mountains', say: 'When they collide, mountains rise.' },
    { big: 'slip → earthquakes', say: 'When they slip, earthquakes strike.' },
    { big: '🌋 magma rises', say: 'At gaps, magma erupts as volcanoes.' },
  ]},
  { id: 'atmosphere', topic: 'Layers of the Atmosphere', subject: 'General', language: 'English', emoji: '🌍', accent: 'indigo', hook: 'The air above us 🌍', beats: [
    { big: 'Troposphere', say: 'Weather happens in the lowest layer.' },
    { big: 'Stratosphere 🛩️', say: 'Planes fly here, where the ozone protects us.' },
    { big: 'Mesosphere ☄️', say: 'Meteors burn up in the mesosphere.' },
    { big: 'Thermosphere 🛰️', say: 'Satellites and auroras live way up here.' },
  ]},
  { id: 'eclipses', topic: 'Solar & Lunar Eclipses', subject: 'General', language: 'English', emoji: '🌑', accent: 'teal', hook: 'When shadows align 🌑', beats: [
    { big: '☀️🌙🌍', say: 'A solar eclipse: the Moon blocks the Sun.' },
    { big: 'Moon’s shadow', say: 'The Moon casts its shadow on Earth.' },
    { big: '☀️🌍🌙', say: 'A lunar eclipse: Earth blocks sunlight to the Moon.' },
    { big: 'rare alignment', say: 'It only happens when all three line up.' },
  ]},
  { id: 'monsoon', topic: 'The Monsoon', subject: 'General', language: 'English', emoji: '🌧️', accent: 'indigo', hook: 'India’s rainy lifeline 🌧️', beats: [
    { big: 'land heats fast 🔥', say: 'In summer, land heats faster than the sea.' },
    { big: 'hot air rises ⬆️', say: 'Rising hot air leaves a low-pressure zone.' },
    { big: 'sea winds rush in 🌊', say: 'Moist sea winds rush in to fill it.' },
    { big: '🌧️ heavy rain', say: 'They drop heavy rain across the subcontinent.' },
  ]},
  { id: 'moon-phases', topic: 'Phases of the Moon', subject: 'General', language: 'English', emoji: '🌗', accent: 'saffron', hook: 'Why the Moon changes shape 🌗', beats: [
    { big: 'same Moon 🌕', say: 'The Moon doesn’t actually change shape.' },
    { big: 'sunlight angle', say: 'We see different lit portions as it orbits.' },
    { big: '🌑→🌓→🌕→🌗', say: 'New, half, full, then back again.' },
    { big: '~29 days 🔁', say: 'One full cycle takes about twenty-nine days.' },
  ]},
  { id: 'carbon-cycle', topic: 'The Carbon Cycle', subject: 'General', language: 'English', emoji: '♻️', accent: 'teal', hook: 'Carbon goes round ♻️', beats: [
    { big: '🌱 plants absorb CO₂', say: 'Plants pull carbon dioxide from the air.' },
    { big: '🫁 animals release it', say: 'Animals breathe it back out.' },
    { big: '⛽ burning adds more', say: 'Burning fuels releases stored carbon fast.' },
    { big: 'balance matters 🌍', say: 'Too much CO₂ warms the planet.' },
  ]},
  { id: 'latitude-longitude', topic: 'Latitude & Longitude', subject: 'General', language: 'English', emoji: '🧭', accent: 'indigo', hook: 'Earth’s address system 🧭', beats: [
    { big: 'lat = horizontal', say: 'Latitude lines run east–west, measuring north–south.' },
    { big: 'long = vertical', say: 'Longitude lines run north–south, measuring east–west.' },
    { big: '0° equator', say: 'The equator is zero degrees latitude.' },
    { big: '📍 find anywhere', say: 'Together they pinpoint any spot on Earth.' },
  ]},

  // ═══════════════════ CIVICS / ECONOMICS / HISTORY ═══════════════════
  { id: 'constitution', topic: 'Indian Constitution', subject: 'General', language: 'English', emoji: '📜', accent: 'saffron', hook: 'India’s rulebook 📜', beats: [
    { big: '1950 🇮🇳', say: 'It came into force on 26 January 1950.' },
    { big: 'longest written', say: 'It’s the world’s longest written constitution.' },
    { big: 'Dr. Ambedkar', say: 'Dr. B. R. Ambedkar chaired its drafting.' },
    { big: 'rights + duties', say: 'It gives citizens fundamental rights and duties.' },
  ]},
  { id: 'three-branches', topic: 'Three Branches of Govt', subject: 'General', language: 'English', emoji: '🏛️', accent: 'indigo', hook: 'How a democracy runs 🏛️', beats: [
    { big: 'Legislature', say: 'The legislature makes the laws.' },
    { big: 'Executive', say: 'The executive carries them out.' },
    { big: 'Judiciary', say: 'The judiciary interprets them.' },
    { big: 'checks & balances ⚖️', say: 'Each keeps the others in check.' },
  ]},
  { id: 'demand-supply-2', topic: 'Demand & Supply Curve', subject: 'General', language: 'English', emoji: '📉', accent: 'teal', hook: 'Where price is born 📉', beats: [
    { big: 'demand ↘️', say: 'Demand falls as price rises.' },
    { big: 'supply ↗️', say: 'Supply rises as price rises.' },
    { big: 'they cross ✖️', say: 'Where the curves cross is the market price.' },
    { big: 'equilibrium', say: 'That balance point is called equilibrium.' },
  ]},
  { id: 'industrial-revolution', topic: 'Industrial Revolution', subject: 'General', language: 'English', emoji: '🏭', accent: 'saffron', hook: 'The world went mechanical 🏭', beats: [
    { big: '1760s 🇬🇧', say: 'It began in Britain in the late 1700s.' },
    { big: 'steam engine', say: 'The steam engine powered new machines.' },
    { big: 'hand → factory', say: 'Goods moved from handmade to mass-produced.' },
    { big: 'changed everything', say: 'It reshaped work, cities, and daily life.' },
  ]},
  { id: 'world-war-2', topic: 'World War II', subject: 'General', language: 'English', emoji: '🌍', accent: 'indigo', hook: 'The largest war ever 🌍', beats: [
    { big: '1939–1945', say: 'It raged for six years across the globe.' },
    { big: 'Allies vs Axis', say: 'The Allies fought the Axis powers.' },
    { big: '🌐 global', say: 'Nearly every major nation was involved.' },
    { big: '→ UN formed', say: 'Afterward, the United Nations was created for peace.' },
  ]},

  // ═══════════════════ ENGLISH / APTITUDE ═══════════════════
  { id: 'parts-speech', topic: 'Parts of Speech', subject: 'General', language: 'English', emoji: '📖', accent: 'teal', hook: 'The 8 building blocks 📖', beats: [
    { big: 'Noun + Verb', say: 'Nouns name things; verbs are actions.' },
    { big: 'Adjective + Adverb', say: 'Adjectives describe nouns; adverbs describe verbs.' },
    { big: 'Pronoun, Prep…', say: 'Pronouns, prepositions, conjunctions link it all.' },
    { big: '8 total', say: 'Master these eight and grammar clicks.' },
  ]},
  { id: 'speed-distance', topic: 'Speed, Distance, Time', subject: 'Mathematics', language: 'English', emoji: '🚗', accent: 'saffron', hook: 'The travel triangle 🚗', beats: [
    { big: 'Speed = Dist/Time', say: 'Speed is distance divided by time.' },
    { big: '120 km, 2 hr', say: 'Travel a hundred twenty kilometres in two hours…' },
    { big: '= 60 km/h', say: 'and your speed is sixty kilometres per hour.' },
    { big: 'cover the triangle 🔺', say: 'Cover the one you want to find — easy.' },
  ]},
  { id: 'time-work', topic: 'Time & Work', subject: 'Mathematics', language: 'English', emoji: '⏱️', accent: 'indigo', hook: 'Faster together ⏱️', beats: [
    { big: 'A: 10 days', say: 'A finishes a job in ten days.' },
    { big: 'B: 15 days', say: 'B finishes the same job in fifteen.' },
    { big: 'add rates 1/10+1/15', say: 'Together, add their work rates.' },
    { big: '= 6 days', say: 'They finish in just six days together.' },
  ]},
  { id: 'averages', topic: 'Averages', subject: 'Mathematics', language: 'English', emoji: '📊', accent: 'teal', hook: 'The middle value 📊', beats: [
    { big: 'sum ÷ count', say: 'An average is the total divided by how many.' },
    { big: '10,20,30', say: 'Take ten, twenty, thirty.' },
    { big: '60 ÷ 3', say: 'Sum is sixty, count is three.' },
    { big: '= 20', say: 'So the average is twenty.' },
  ]},

  // ═══════════════════ MORE HINDI REELS ═══════════════════
  { id: 'ohms-hindi', topic: "Ohm's Law — Hindi", subject: 'Physics', language: 'Hindi', emoji: '⚡', accent: 'saffron', hook: 'Har circuit ka niyam ⚡', beats: [
    { big: 'V = I × R', say: 'Voltage barabar hai current guna resistance.' },
    { big: '🔋 dhakka deta', say: 'Voltage electrons ko dhakka deta hai.' },
    { big: 'R rokta hai', say: 'Resistance flow ko rokti hai.' },
    { big: '12V ÷ 6Ω = 2A', say: 'Baarah volt aur chhe ohm se do ampere current.' },
  ]},
  { id: 'cell-hindi', topic: 'Koshika (Cell)', subject: 'Biology', language: 'Hindi', emoji: '🔬', accent: 'teal', hook: 'Jeevan ki ikai 🔬', beats: [
    { big: 'Cell = ikai', say: 'Koshika jeevan ki sabse chhoti ikai hai.' },
    { big: 'Nucleus 🧠', say: 'Nucleus koshika ko control karta hai.' },
    { big: 'Mitochondria 🔋', say: 'Mitochondria energy banata hai.' },
    { big: 'Membrane 🛡️', say: 'Membrane koshika ko ghere rakhti hai.' },
  ]},
  { id: 'fractions-hindi', topic: 'Bhinn jodna (Fractions)', subject: 'Mathematics', language: 'Hindi', emoji: '🍕', accent: 'indigo', hook: 'Pizza wala maths 🍕', beats: [
    { big: '1/2 + 1/3', say: 'Alag denominator wale bhinn seedhe nahi jud te.' },
    { big: 'LCM = 6', say: 'Common denominator nikalo — yahan chhe.' },
    { big: '3/6 + 2/6', say: 'Dono ko chhe ke upar likho.' },
    { big: '= 5/6', say: 'Ab upar wale jod do — paanch bata chhe.' },
  ]},
  { id: 'acids-hindi', topic: 'Amla aur Kshaar', subject: 'Chemistry', language: 'Hindi', emoji: '🧪', accent: 'saffron', hook: 'Khatta ya kadwa? 🧪', beats: [
    { big: 'pH 0–14', say: 'pH scale zero se chaudah tak hota hai.' },
    { big: '< 7 amla 🍋', say: 'Saat se kam matlab amliya, jaise nimbu.' },
    { big: '7 neutral 💧', say: 'Saat neutral hai — shudh paani.' },
    { big: '> 7 kshaar 🧼', say: 'Saat se zyada matlab kshaariya, jaise sabun.' },
  ]},
  { id: 'motion-hindi', topic: 'Gati ke Niyam', subject: 'Physics', language: 'Hindi', emoji: '🏃', accent: 'indigo', hook: 'Gati ka ganit 🏃', beats: [
    { big: 'v = u + at', say: 'Antim veg barabar prarambhik veg jodo tvaran guna samay.' },
    { big: 's = ut + ½at²', say: 'Doori prarambhik veg aur tvaran se nikalti hai.' },
    { big: 'v² = u² + 2as', say: 'Ye veg ko doori se jodta hai.' },
    { big: '3 sutra ✨', say: 'Ye teen sutra har gati problem solve karte hain.' },
  ]},
  { id: 'digestion-hindi', topic: 'Pachan Tantra', subject: 'Biology', language: 'Hindi', emoji: '🍽️', accent: 'teal', hook: 'Khane se urja tak 🍽️', beats: [
    { big: '👄 muh se shuru', say: 'Pachan muh mein laar se shuru hota hai.' },
    { big: 'Aamashay acid', say: 'Aamashay mein acid khana todta hai.' },
    { big: 'Choti aant', say: 'Poshak tatva choti aant mein absorb hote hain.' },
    { big: 'urja + apशिष्ट', say: 'Kaam ke tatva urja dete, baaki bahar nikalta hai.' },
  ]},
  { id: 'photosynthesis-eq-hindi', topic: 'Pradeepan ka Sutra', subject: 'Biology', language: 'Hindi', emoji: '🌞', accent: 'saffron', hook: 'Paudhon ki recipe 🌞', beats: [
    { big: '6CO₂ + 6H₂O', say: 'Paudhe carbon dioxide aur paani lete hain.' },
    { big: '+ ☀️ + chlorophyll', say: 'Sunlight aur chlorophyll ki madad se.' },
    { big: '→ C₆H₁₂O₆', say: 'Glucose banta hai — unka khana.' },
    { big: '+ 6O₂ 🫁', say: 'Aur oxygen nikalti hai jo hum saans lete hain.' },
  ]},
  { id: 'gravity-num-hindi', topic: 'Gurutvakarshan', subject: 'Physics', language: 'Hindi', emoji: '🌍', accent: 'indigo', hook: 'Sab neeche kyun girta 🌍', beats: [
    { big: 'g = 9.8 m/s²', say: 'Dharti par har cheez 9.8 se tvarit hoti hai.' },
    { big: 'W = m × g', say: 'Bhaar barabar dravyaman guna g.' },
    { big: 'Chand par g/6', say: 'Chand par gurutva chhatha hissa hai.' },
    { big: 'dravyaman same', say: 'Dravyaman har jagah ek — sirf bhaar badalta hai.' },
  ]},

  // ═══════════════════ EXTRA STEM BANGERS ═══════════════════
  { id: 'speed-of-sound', topic: 'Speed of Sound', subject: 'Physics', language: 'English', emoji: '🔊', accent: 'saffron', hook: 'Count the thunder gap 🔊', beats: [
    { big: '343 m/s', say: 'Sound travels at about 343 metres per second in air.' },
    { big: '⚡ then 🔊', say: 'Light reaches you instantly; sound lags behind.' },
    { big: '3 sec ≈ 1 km', say: 'Three seconds of gap means lightning is a kilometre away.' },
    { big: 'faster in water 🌊', say: 'It moves even faster through water and steel.' },
  ]},
  { id: 'ph-buffer', topic: 'Why Blood pH is Stable', subject: 'Biology', language: 'English', emoji: '🩸', accent: 'teal', hook: 'Your body’s pH guard 🩸', beats: [
    { big: 'blood pH 7.4', say: 'Your blood stays at a steady 7.4.' },
    { big: 'buffers 🛡️', say: 'Chemical buffers resist sudden pH changes.' },
    { big: 'too acidic = danger', say: 'Even a small drop can be life-threatening.' },
    { big: 'lungs + kidneys', say: 'Your lungs and kidneys fine-tune it constantly.' },
  ]},
  { id: 'newton-1', topic: "Newton's 1st Law", subject: 'Physics', language: 'English', emoji: '🛑', accent: 'indigo', hook: 'Objects are lazy 🛑', beats: [
    { big: 'inertia', say: 'Objects resist any change in motion.' },
    { big: 'rest stays rest', say: 'A still object stays still unless pushed.' },
    { big: 'moving stays moving', say: 'A moving object keeps going unless stopped.' },
    { big: '🚗 seatbelt!', say: 'That’s why you lurch forward when a car brakes.' },
  ]},
  { id: 'newton-2', topic: "Newton's 2nd Law", subject: 'Physics', language: 'English', emoji: '🏋️', accent: 'saffron', hook: 'Force = mass × acceleration 🏋️', beats: [
    { big: 'F = ma', say: 'Force equals mass times acceleration.' },
    { big: 'more force ⬆️', say: 'More force means more acceleration.' },
    { big: 'more mass ⬇️', say: 'More mass means less acceleration.' },
    { big: 'push a cart 🛒', say: 'A loaded cart is harder to speed up.' },
  ]},
  { id: 'percent-change', topic: 'Percentage Change', subject: 'Mathematics', language: 'English', emoji: '📈', accent: 'teal', hook: 'Up or down by how much? 📈', beats: [
    { big: 'change/original ×100', say: 'Divide the change by the original, then times a hundred.' },
    { big: '50 → 60', say: 'A price rises from fifty to sixty.' },
    { big: '10/50 × 100', say: 'The change is ten over fifty.' },
    { big: '= 20% up', say: 'That’s a twenty percent increase.' },
  ]},
  { id: 'prob-dice-sum', topic: 'Dice Sum Probability', subject: 'Mathematics', language: 'English', emoji: '🎲', accent: 'indigo', hook: 'Roll two dice 🎲', beats: [
    { big: '36 outcomes', say: 'Two dice give thirty-six equally likely results.' },
    { big: 'sum of 7?', say: 'How many ways make a seven?' },
    { big: '6 ways', say: 'There are six combinations that total seven.' },
    { big: 'P = 6/36 = 1/6', say: 'So the chance of seven is one in six.' },
  ]},
  { id: 'osmosis', topic: 'Osmosis', subject: 'Biology', language: 'English', emoji: '💧', accent: 'teal', hook: 'Water moves on its own 💧', beats: [
    { big: 'water → high solute', say: 'Water flows toward the saltier side.' },
    { big: 'through membrane', say: 'It passes through a semi-permeable membrane.' },
    { big: '🥒 → pickle', say: 'It’s why a cucumber shrivels into a pickle.' },
    { big: 'roots drink this way 🌱', say: 'Plant roots absorb water by osmosis.' },
  ]},
  { id: 'velocity-accel', topic: 'Speed vs Velocity', subject: 'Physics', language: 'English', emoji: '🧭', accent: 'saffron', hook: 'They’re NOT the same 🧭', beats: [
    { big: 'speed = how fast', say: 'Speed only tells you how fast.' },
    { big: 'velocity = + direction', say: 'Velocity adds the direction too.' },
    { big: '60 km/h north', say: 'Sixty north is a velocity, not just a speed.' },
    { big: 'vector vs scalar', say: 'Velocity is a vector; speed is a scalar.' },
  ]},
  { id: 'ecosystem-2', topic: 'Producers & Consumers', subject: 'Biology', language: 'English', emoji: '🌳', accent: 'indigo', hook: 'Who makes, who takes 🌳', beats: [
    { big: '🌱 producers', say: 'Plants make their own food — they’re producers.' },
    { big: '🐄 consumers', say: 'Animals eat others — they’re consumers.' },
    { big: '🍄 decomposers', say: 'Fungi break down the dead and recycle it.' },
    { big: 'perfect loop ♻️', say: 'Together they keep nature in balance.' },
  ]},
  { id: 'compound-vs-simple', topic: 'Simple vs Compound Interest', subject: 'Mathematics', language: 'English', emoji: '💹', accent: 'teal', hook: 'Which grows faster? 💹', beats: [
    { big: 'Simple = flat', say: 'Simple interest is the same every year.' },
    { big: 'Compound = on interest', say: 'Compound earns interest on interest.' },
    { big: 'curve vs line 📈', say: 'Compound curves upward; simple is a straight line.' },
    { big: 'time wins ⏳', say: 'Over years, compound pulls far ahead.' },
  ]},

  // ═══════════════════ BATCH 2 — MATHEMATICS ═══════════════════
  { id: 'area-triangle', topic: 'Area of a Triangle', subject: 'Mathematics', language: 'English', emoji: '🔺', accent: 'saffron', hook: 'Half base times height 🔺', beats: [
    { big: 'A = ½ × b × h', say: 'A triangle’s area is half the base times the height.' },
    { big: 'b=6, h=4', say: 'Take a base of six and height of four.' },
    { big: '½ × 24', say: 'Multiply and halve it.' },
    { big: '= 12', say: 'The area is twelve square units.' },
  ]},
  { id: 'circumference', topic: 'Circumference', subject: 'Mathematics', language: 'English', emoji: '⭕', accent: 'indigo', hook: 'The distance around ⭕', beats: [
    { big: 'C = 2πr', say: 'Circumference is two pi times the radius.' },
    { big: 'or πd', say: 'Or simply pi times the diameter.' },
    { big: 'r = 7', say: 'For radius seven…' },
    { big: '≈ 44', say: 'the circumference is about forty-four.' },
  ]},
  { id: 'algebra-identity', topic: '(a+b)² Identity', subject: 'Mathematics', language: 'English', emoji: '🧮', accent: 'teal', hook: 'Expand in your head 🧮', beats: [
    { big: '(a+b)²', say: 'Squaring a sum has a neat pattern.' },
    { big: '= a² + 2ab + b²', say: 'It equals a squared plus two a b plus b squared.' },
    { big: '(x+3)²', say: 'So x plus three, squared…' },
    { big: '= x²+6x+9', say: 'becomes x squared plus six x plus nine.' },
  ]},
  { id: 'divisibility', topic: 'Divisibility Tricks', subject: 'Mathematics', language: 'English', emoji: '➗', accent: 'indigo', hook: 'Check without dividing ➗', beats: [
    { big: 'by 2: even', say: 'A number is divisible by two if it’s even.' },
    { big: 'by 3: digit sum', say: 'By three if its digit sum divides by three.' },
    { big: 'by 5: ends 0/5', say: 'By five if it ends in zero or five.' },
    { big: 'by 9: digit sum', say: 'By nine if the digit sum divides by nine.' },
  ]},
  { id: 'integers', topic: 'Negative Numbers', subject: 'Mathematics', language: 'English', emoji: '➖', accent: 'saffron', hook: 'Below zero ➖', beats: [
    { big: '−3 + 5 = 2', say: 'Adding a bigger positive flips it positive.' },
    { big: '− × − = +', say: 'A negative times a negative is positive.' },
    { big: '− × + = −', say: 'Different signs give a negative.' },
    { big: '🌡️ like temperature', say: 'Think of it like temperatures below zero.' },
  ]},
  { id: 'gp', topic: 'Geometric Progression', subject: 'Mathematics', language: 'English', emoji: '📈', accent: 'teal', hook: 'Multiply each time 📈', beats: [
    { big: '2,4,8,16…', say: 'Each term is multiplied by a fixed ratio.' },
    { big: 'r = 2', say: 'Here the common ratio is two.' },
    { big: 'aₙ = a·rⁿ⁻¹', say: 'The nth term uses the ratio raised to a power.' },
    { big: 'explodes fast 🚀', say: 'GP grows incredibly fast — that’s exponential growth.' },
  ]},
  { id: 'similar-triangles', topic: 'Similar Triangles', subject: 'Mathematics', language: 'English', emoji: '🔺', accent: 'indigo', hook: 'Same shape, different size 🔺', beats: [
    { big: 'equal angles', say: 'Similar triangles have all angles equal.' },
    { big: 'sides in ratio', say: 'Their matching sides stay in the same ratio.' },
    { big: '📏 measure heights', say: 'It lets us measure tall buildings using shadows.' },
    { big: 'AA rule', say: 'Two equal angles are enough to prove similarity.' },
  ]},
  { id: 'place-value', topic: 'Place Value', subject: 'Mathematics', language: 'English', emoji: '🔢', accent: 'saffron', hook: 'Why position matters 🔢', beats: [
    { big: '3 4 5', say: 'In 345 each digit has a place.' },
    { big: '300 + 40 + 5', say: 'Hundreds, tens, and ones.' },
    { big: 'same digit, diff value', say: 'The 3 means three hundred, not just three.' },
    { big: 'base 10 🔟', say: 'Each place is ten times the one to its right.' },
  ]},

  // ═══════════════════ BATCH 2 — PHYSICS ═══════════════════
  { id: 'heat-transfer', topic: 'Heat Transfer', subject: 'Physics', language: 'English', emoji: '🔥', accent: 'saffron', hook: '3 ways heat moves 🔥', beats: [
    { big: 'Conduction', say: 'Conduction moves heat through direct contact.' },
    { big: 'Convection', say: 'Convection moves heat through flowing liquids and gases.' },
    { big: 'Radiation ☀️', say: 'Radiation carries heat as waves — even through space.' },
    { big: 'Sun → you', say: 'The Sun warms you by radiation.' },
  ]},
  { id: 'hookes-law', topic: "Hooke's Law", subject: 'Physics', language: 'English', emoji: '🪀', accent: 'indigo', hook: 'How springs stretch 🪀', beats: [
    { big: 'F = kx', say: 'Spring force is proportional to how far it stretches.' },
    { big: 'more stretch = more force', say: 'Pull twice as far, feel twice the force.' },
    { big: 'stiff = big k', say: 'A stiff spring has a large spring constant.' },
    { big: 'too far → breaks', say: 'Stretch past its limit and it won’t bounce back.' },
  ]},
  { id: 'reflection', topic: 'Reflection of Light', subject: 'Physics', language: 'English', emoji: '🪞', accent: 'teal', hook: 'How mirrors work 🪞', beats: [
    { big: 'angle in = angle out', say: 'The angle of incidence equals the angle of reflection.' },
    { big: 'from the normal', say: 'Both angles are measured from the normal line.' },
    { big: '🪞 flat mirror', say: 'A flat mirror flips left and right.' },
    { big: 'smooth = clear', say: 'Smooth surfaces give a clear reflection.' },
  ]},
  { id: 'machines', topic: 'Simple Machines', subject: 'Physics', language: 'English', emoji: '⚙️', accent: 'saffron', hook: 'Work smarter ⚙️', beats: [
    { big: 'lever, pulley, wedge', say: 'Simple machines multiply your force.' },
    { big: 'less force, more dist', say: 'You trade extra distance for less effort.' },
    { big: '🏗️ pulley lifts', say: 'A pulley lets you lift heavy loads easily.' },
    { big: 'work stays same', say: 'They don’t reduce work — just make it easier.' },
  ]},
  { id: 'temperature-scales', topic: 'Temperature Scales', subject: 'Physics', language: 'English', emoji: '🌡️', accent: 'indigo', hook: '°C, °F, K 🌡️', beats: [
    { big: 'Water freezes 0°C', say: 'Water freezes at zero Celsius.' },
    { big: 'boils 100°C', say: 'And boils at a hundred Celsius.' },
    { big: 'K = °C + 273', say: 'Kelvin adds 273 to Celsius.' },
    { big: '0 K = no motion', say: 'Absolute zero is where all motion stops.' },
  ]},
  { id: 'dc-ac', topic: 'AC vs DC', subject: 'Physics', language: 'English', emoji: '🔌', accent: 'teal', hook: 'Two kinds of current 🔌', beats: [
    { big: 'DC → one way', say: 'Direct current flows in one direction.' },
    { big: '🔋 batteries', say: 'Batteries give DC.' },
    { big: 'AC → back & forth', say: 'Alternating current switches direction rapidly.' },
    { big: '🏠 wall sockets', say: 'Your home runs on AC.' },
  ]},
  { id: 'echo', topic: 'Echoes', subject: 'Physics', language: 'English', emoji: '🏔️', accent: 'saffron', hook: 'Sound bounces back 🏔️', beats: [
    { big: 'sound reflects', say: 'An echo is sound bouncing off a surface.' },
    { big: 'need distance', say: 'You need enough distance to hear it separately.' },
    { big: '🦇 bats use it', say: 'Bats and sonar navigate using echoes.' },
    { big: 'depth of sea 🌊', say: 'Ships measure ocean depth with echoes.' },
  ]},

  // ═══════════════════ BATCH 2 — CHEMISTRY ═══════════════════
  { id: 'physical-chemical', topic: 'Physical vs Chemical Change', subject: 'Chemistry', language: 'English', emoji: '🔀', accent: 'indigo', hook: 'Reversible or not? 🔀', beats: [
    { big: 'Physical = reversible', say: 'Physical changes don’t make new substances.' },
    { big: '🧊 ice melts', say: 'Melting ice is physical — still water.' },
    { big: 'Chemical = new stuff', say: 'Chemical changes create new substances.' },
    { big: '🔥 burning paper', say: 'Burning paper is chemical — you can’t undo it.' },
  ]},
  { id: 'mixtures', topic: 'Mixtures vs Compounds', subject: 'Chemistry', language: 'English', emoji: '🥗', accent: 'saffron', hook: 'Mixed or bonded? 🥗', beats: [
    { big: 'Mixture = no bond', say: 'A mixture is just things stirred together.' },
    { big: '🥗 salad', say: 'Like a salad — separate easily.' },
    { big: 'Compound = bonded', say: 'A compound has atoms chemically bonded.' },
    { big: '💧 water', say: 'Water is a compound — can’t pick out the H and O.' },
  ]},
  { id: 'reactivity-series', topic: 'Reactivity Series', subject: 'Chemistry', language: 'English', emoji: '🥇', accent: 'teal', hook: 'Which metal wins? 🥇', beats: [
    { big: 'K Na Ca Mg…', say: 'Metals rank by how readily they react.' },
    { big: 'top = fierce', say: 'Potassium and sodium react violently.' },
    { big: 'bottom = chill', say: 'Gold and platinum barely react at all.' },
    { big: 'more reactive displaces', say: 'A higher metal kicks out a lower one from compounds.' },
  ]},
  { id: 'balancing', topic: 'Balancing Equations', subject: 'Chemistry', language: 'English', emoji: '⚖️', accent: 'indigo', hook: 'Atoms must match ⚖️', beats: [
    { big: 'H₂ + O₂ → H₂O', say: 'Count atoms on both sides — they must be equal.' },
    { big: 'not balanced ❌', say: 'Here oxygen doesn’t match yet.' },
    { big: '2H₂ + O₂ → 2H₂O', say: 'Add coefficients to balance it.' },
    { big: 'mass conserved ✅', say: 'Matter is never created or destroyed.' },
  ]},
  { id: 'exothermic', topic: 'Exo vs Endothermic', subject: 'Chemistry', language: 'English', emoji: '🌡️', accent: 'saffron', hook: 'Heat in or out? 🌡️', beats: [
    { big: 'Exo → releases heat', say: 'Exothermic reactions give off heat.' },
    { big: '🔥 burning, 🧨', say: 'Burning and explosions are exothermic.' },
    { big: 'Endo → absorbs heat', say: 'Endothermic reactions soak up heat.' },
    { big: '🧊 cold packs', say: 'Instant cold packs feel cold for this reason.' },
  ]},
  { id: 'separation', topic: 'Separation Techniques', subject: 'Chemistry', language: 'English', emoji: '🧪', accent: 'teal', hook: 'Un-mix a mixture 🧪', beats: [
    { big: 'Filtration', say: 'Filtration separates solids from liquids.' },
    { big: 'Evaporation', say: 'Evaporation leaves dissolved salt behind.' },
    { big: 'Distillation', say: 'Distillation separates liquids by boiling point.' },
    { big: '🧲 magnet', say: 'A magnet pulls out iron bits.' },
  ]},

  // ═══════════════════ BATCH 2 — BIOLOGY ═══════════════════
  { id: 'vitamins', topic: 'Vitamins', subject: 'Biology', language: 'English', emoji: '🍊', accent: 'saffron', hook: 'Tiny but vital 🍊', beats: [
    { big: 'A: eyes 👁️', say: 'Vitamin A keeps your eyes healthy.' },
    { big: 'C: immunity 🍊', say: 'Vitamin C boosts immunity — found in citrus.' },
    { big: 'D: bones ☀️', say: 'Vitamin D from sunlight strengthens bones.' },
    { big: 'deficiency = disease', say: 'Lacking them causes scurvy, rickets, and more.' },
  ]},
  { id: 'skeleton', topic: 'The Skeleton', subject: 'Biology', language: 'English', emoji: '🦴', accent: 'indigo', hook: '206 bones strong 🦴', beats: [
    { big: '206 bones', say: 'An adult body has two hundred six bones.' },
    { big: 'protects organs 🛡️', say: 'The skull and ribs shield vital organs.' },
    { big: 'makes blood 🩸', say: 'Bone marrow produces your blood cells.' },
    { big: 'babies: 300!', say: 'Babies start with about three hundred bones.' },
  ]},
  { id: 'eye', topic: 'How the Eye Works', subject: 'Biology', language: 'English', emoji: '👁️', accent: 'teal', hook: 'Your living camera 👁️', beats: [
    { big: 'light enters 👁️', say: 'Light enters through the pupil.' },
    { big: 'lens focuses', say: 'The lens focuses it onto the retina.' },
    { big: 'retina → signals', say: 'The retina turns light into nerve signals.' },
    { big: '🧠 brain sees', say: 'Your brain flips and interprets the image.' },
  ]},
  { id: 'germination', topic: 'Seed Germination', subject: 'Biology', language: 'English', emoji: '🌱', accent: 'saffron', hook: 'A seed wakes up 🌱', beats: [
    { big: '💧 + ☀️ + air', say: 'Seeds need water, warmth, and air to sprout.' },
    { big: 'root first ⬇️', say: 'The root pushes down first.' },
    { big: 'shoot up ⬆️', say: 'Then the shoot reaches for the light.' },
    { big: 'new plant 🌿', say: 'And a brand new plant begins.' },
  ]},
  { id: 'classification', topic: 'Classification of Life', subject: 'Biology', language: 'English', emoji: '🦋', accent: 'indigo', hook: 'Sorting all living things 🦋', beats: [
    { big: 'Kingdom → Species', say: 'Life is sorted from broad kingdoms to specific species.' },
    { big: 'vertebrate?', say: 'Animals split into those with and without backbones.' },
    { big: '🐟🐸🦎🐦🐅', say: 'Fish, amphibians, reptiles, birds, mammals.' },
    { big: 'shared traits', say: 'Grouping is based on shared features.' },
  ]},
  { id: 'balanced-diet', topic: 'Balanced Diet', subject: 'Biology', language: 'English', emoji: '🍱', accent: 'teal', hook: 'Fuel your body right 🍱', beats: [
    { big: 'carbs = energy', say: 'Carbohydrates give quick energy.' },
    { big: 'protein = repair', say: 'Proteins build and repair your body.' },
    { big: 'fats, vitamins, minerals', say: 'Fats, vitamins and minerals keep you healthy.' },
    { big: 'variety wins 🥗', say: 'A mix of all of these is a balanced diet.' },
  ]},

  // ═══════════════════ BATCH 2 — CS / GK / ENGLISH ═══════════════════
  { id: 'ram-rom', topic: 'RAM vs Storage', subject: 'Computer Science', language: 'English', emoji: '💾', accent: 'indigo', hook: 'Memory vs storage 💾', beats: [
    { big: 'RAM = workspace', say: 'RAM is fast, temporary working memory.' },
    { big: 'cleared on shutdown', say: 'It empties when you turn the device off.' },
    { big: 'Storage = drawer', say: 'Storage keeps files permanently.' },
    { big: 'SSD/HDD 💽', say: 'Your photos live on the SSD or hard drive.' },
  ]},
  { id: 'pixels', topic: 'How Screens Show Images', subject: 'Computer Science', language: 'English', emoji: '🟥', accent: 'saffron', hook: 'Made of tiny dots 🟥', beats: [
    { big: 'pixels', say: 'Screens are grids of tiny dots called pixels.' },
    { big: 'R + G + B', say: 'Each pixel mixes red, green, and blue light.' },
    { big: 'millions of them', say: 'Millions combine into a full picture.' },
    { big: '4K = 8M pixels', say: 'A 4K screen has over eight million pixels.' },
  ]},
  { id: 'debugging', topic: 'Debugging', subject: 'Computer Science', language: 'English', emoji: '🐞', accent: 'teal', hook: 'Hunting code bugs 🐞', beats: [
    { big: 'bug = error', say: 'A bug is a mistake in your code.' },
    { big: 'reproduce it', say: 'First, make the error happen again reliably.' },
    { big: 'narrow it down 🔍', say: 'Then isolate exactly where it breaks.' },
    { big: 'fix & test ✅', say: 'Fix it and test that nothing else broke.' },
  ]},
  { id: 'big-bang', topic: 'The Big Bang', subject: 'General', language: 'English', emoji: '💥', accent: 'indigo', hook: 'How it all began 💥', beats: [
    { big: '13.8 billion yrs', say: 'The universe began about 13.8 billion years ago.' },
    { big: 'tiny → huge', say: 'It expanded from an incredibly hot, dense point.' },
    { big: 'still expanding 🎈', say: 'And it’s still stretching outward today.' },
    { big: 'galaxies racing away', say: 'Distant galaxies are all flying apart from us.' },
  ]},
  { id: 'money-functions', topic: 'Functions of Money', subject: 'General', language: 'English', emoji: '💰', accent: 'saffron', hook: 'Why money matters 💰', beats: [
    { big: 'medium of exchange', say: 'Money lets us trade without bartering.' },
    { big: 'store of value', say: 'It stores wealth for the future.' },
    { big: 'unit of account', say: 'It measures the value of things.' },
    { big: 'beats barter 🔄', say: 'No more swapping goats for grain!' },
  ]},
  { id: 'rivers-india', topic: 'Rivers of India', subject: 'General', language: 'English', emoji: '🏞️', accent: 'teal', hook: 'India’s lifelines 🏞️', beats: [
    { big: 'Ganga 🛕', say: 'The Ganga is India’s longest and holiest river.' },
    { big: 'from Himalayas 🏔️', say: 'It flows from the Himalayan glaciers.' },
    { big: 'Brahmaputra, Yamuna', say: 'Other giants include the Brahmaputra and Yamuna.' },
    { big: 'feed millions 🌾', say: 'They water farms feeding hundreds of millions.' },
  ]},
  { id: 'tenses-detail', topic: 'Present Perfect Tense', subject: 'General', language: 'English', emoji: '⏰', accent: 'indigo', hook: 'Has it finished? ⏰', beats: [
    { big: 'have/has + V3', say: 'Present perfect uses have or has plus the past participle.' },
    { big: '“I have eaten”', say: 'It links the past to now.' },
    { big: 'no exact time ⏳', say: 'It doesn’t say exactly when it happened.' },
    { big: 'result matters', say: 'It focuses on the result, not the moment.' },
  ]},
  { id: 'prepositions', topic: 'Prepositions', subject: 'General', language: 'English', emoji: '📍', accent: 'saffron', hook: 'in, on, at 📍', beats: [
    { big: 'at = point', say: 'Use at for a specific point — at 5pm.' },
    { big: 'on = surface/day', say: 'Use on for surfaces and days — on Monday.' },
    { big: 'in = enclosed/period', say: 'Use in for months, years, and spaces — in 2026.' },
    { big: 'practice makes perfect', say: 'A little practice and these become automatic.' },
  ]},
  { id: 'photosynthesis-factors', topic: 'What Affects Photosynthesis', subject: 'Biology', language: 'English', emoji: '🌞', accent: 'teal', hook: '3 things plants need 🌞', beats: [
    { big: '☀️ light', say: 'More light, faster photosynthesis — up to a limit.' },
    { big: '🌡️ temperature', say: 'Warmth helps, but too much harms the enzymes.' },
    { big: 'CO₂ level', say: 'More carbon dioxide speeds it up.' },
    { big: 'all needed', say: 'Whichever is lowest limits the whole rate.' },
  ]},
  { id: 'square-cube-numbers', topic: 'Squares & Cubes', subject: 'Mathematics', language: 'English', emoji: '🔲', accent: 'indigo', hook: 'Powers worth memorising 🔲', beats: [
    { big: '5² = 25', say: 'A square is a number times itself.' },
    { big: '5³ = 125', say: 'A cube multiplies it three times.' },
    { big: '1,4,9,16,25', say: 'Memorise squares up to fifteen.' },
    { big: 'speeds up maths ⚡', say: 'Knowing them makes calculations lightning fast.' },
  ]},
  { id: 'newton-cooling', topic: 'Why Tea Cools Down', subject: 'Physics', language: 'English', emoji: '☕', accent: 'saffron', hook: 'Hot things cool fast ☕', beats: [
    { big: 'hotter → cools faster', say: 'The hotter an object, the faster it loses heat.' },
    { big: 'Newton’s cooling', say: 'That’s Newton’s law of cooling.' },
    { big: 'until room temp', say: 'It slows as it nears room temperature.' },
    { big: '☕ blow to cool', say: 'Blowing speeds it up by removing warm air.' },
  ]},
  { id: 'modulo', topic: 'Modulo (Remainder)', subject: 'Mathematics', language: 'English', emoji: '🕒', accent: 'teal', hook: 'Clock maths 🕒', beats: [
    { big: '17 mod 5', say: 'Modulo gives the remainder after dividing.' },
    { big: '17 = 3×5 + 2', say: 'Seventeen divided by five leaves two.' },
    { big: '= 2', say: 'So seventeen mod five is two.' },
    { big: '🕒 24h clock', say: 'A clock is modulo twelve in action.' },
  ]},
];
