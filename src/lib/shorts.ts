// Handcrafted short-form "reels" — 20–30s punchy explanations.
// Each beat shows a big visual + a spoken line (TTS). ~5 beats × ~5s ≈ 25s.

export interface ShortBeat {
  big: string;       // large on-screen text / equation / emoji
  say: string;       // narration (also shown as caption)
  sub?: string;      // small supporting label under `big`
}

export interface Short {
  id: string;
  topic: string;
  subject: string;
  language: string;
  emoji: string;
  accent: 'saffron' | 'indigo' | 'teal';
  hook: string;      // punchy opening hook line
  beats: ShortBeat[];
}

import { EXTRA_SHORTS } from './shorts-extra';

const CORE_SHORTS: Short[] = [
  {
    id: 'pythagoras',
    topic: 'Pythagoras in 30 seconds',
    subject: 'Mathematics',
    language: 'English',
    emoji: '📐',
    accent: 'saffron',
    hook: 'The most famous equation in geometry 👇',
    beats: [
      { big: 'a² + b² = c²', say: 'In any right-angled triangle, the squares of the two legs add up to the square of the hypotenuse.' },
      { big: '3, 4, 5', sub: 'a perfect triple', say: 'Take legs 3 and 4. Nine plus sixteen equals twenty-five.' },
      { big: '√25 = 5', say: 'So the longest side is exactly five. Clean, whole numbers!' },
      { big: '📏 Real life', say: 'Builders use 3-4-5 to make perfect right angles on site.' },
      { big: 'You got it! ✅', say: 'That is Pythagoras theorem — simple, powerful, everywhere.' },
    ],
  },
  {
    id: 'newton-3',
    topic: "Newton's 3rd Law",
    subject: 'Physics',
    language: 'English',
    emoji: '🚀',
    accent: 'indigo',
    hook: 'Why do rockets fly? 🚀',
    beats: [
      { big: 'Action = Reaction', say: 'For every action, there is an equal and opposite reaction.' },
      { big: '🔥 ↓  Rocket ↑', say: 'A rocket pushes hot gas downward.' },
      { big: 'Gas pushes back', say: 'And the gas pushes the rocket up with equal force.' },
      { big: '🏊 Swimming too', say: 'You push water back, water pushes you forward.' },
      { big: 'Physics is magic ✨', say: 'Every push has a push-back. That is Newton’s third law!' },
    ],
  },
  {
    id: 'photosynthesis',
    topic: 'How plants eat sunlight',
    subject: 'Biology',
    language: 'English',
    emoji: '🌱',
    accent: 'teal',
    hook: 'Plants literally eat light 🌞',
    beats: [
      { big: '🌞 + 💧 + CO₂', say: 'Plants take sunlight, water, and carbon dioxide.' },
      { big: 'Chlorophyll', sub: 'the green magic', say: 'Green chlorophyll captures the sun’s energy.' },
      { big: '→ 🍬 + O₂', say: 'And turns it into sugar — their food — plus oxygen.' },
      { big: 'We breathe it 🫁', say: 'That oxygen is what you are breathing right now.' },
      { big: 'Thank a plant 🌿', say: 'Plants are the original solar-powered food factories.' },
    ],
  },
  {
    id: 'gravity',
    topic: 'Why things fall',
    subject: 'Physics',
    language: 'English',
    emoji: '🍎',
    accent: 'indigo',
    hook: 'An apple changed science forever 🍎',
    beats: [
      { big: 'F = G·m₁m₂/r²', say: 'Every mass attracts every other mass in the universe.' },
      { big: '🍎 ↓', say: 'Earth pulls the apple down — we call it gravity.' },
      { big: '🌙 orbits 🌍', say: 'The same force keeps the Moon circling the Earth.' },
      { big: '2× far = ¼ pull', say: 'Double the distance and the pull drops to a quarter.' },
      { big: 'One law, whole cosmos 🌌', say: 'From apples to galaxies — gravity rules them all.' },
    ],
  },
  {
    id: 'quadratic',
    topic: 'The Quadratic Formula',
    subject: 'Mathematics',
    language: 'English',
    emoji: '🧮',
    accent: 'saffron',
    hook: 'One formula solves them ALL 🧮',
    beats: [
      { big: 'ax² + bx + c = 0', say: 'Any quadratic equation looks like this.' },
      { big: 'x = (-b ± √(b²-4ac)) / 2a', say: 'And this one formula cracks every single one.' },
      { big: 'D = b² - 4ac', sub: 'the discriminant', say: 'The part under the root decides the answer’s nature.' },
      { big: 'D>0, D=0, D<0', say: 'Two roots, one root, or complex roots — D tells you.' },
      { big: 'Memorize it 💪', say: 'Learn this formula and quadratics never scare you again.' },
    ],
  },
  {
    id: 'dna',
    topic: 'DNA — the code of life',
    subject: 'Biology',
    language: 'English',
    emoji: '🧬',
    accent: 'teal',
    hook: 'Your whole body in 4 letters 🧬',
    beats: [
      { big: 'A · T · G · C', say: 'All of life is written in just four letters.' },
      { big: 'A—T   G—C', say: 'A always pairs with T, and G always with C.' },
      { big: '🌀 Double helix', say: 'Two strands twist into the famous double helix.' },
      { big: '2 metres in 1 cell', say: 'Two metres of DNA fits inside one tiny cell.' },
      { big: 'You are unique 💫', say: 'This four-letter code makes you, you.' },
    ],
  },
  {
    id: 'ohms-law',
    topic: "Ohm's Law",
    subject: 'Physics',
    language: 'English',
    emoji: '⚡',
    accent: 'saffron',
    hook: 'The rule behind every circuit ⚡',
    beats: [
      { big: 'V = I × R', say: 'Voltage equals current times resistance.' },
      { big: '🔋 pushes ⚡', say: 'Voltage is the push that drives the current.' },
      { big: 'R resists flow', say: 'Resistance slows the electrons down.' },
      { big: '12V ÷ 6Ω = 2A', say: 'Twelve volts across six ohms gives two amps.' },
      { big: 'Electronics 101 🔌', say: 'Master V equals I R and circuits make sense.' },
    ],
  },
  {
    id: 'binary-search',
    topic: 'Binary Search trick',
    subject: 'Computer Science',
    language: 'English',
    emoji: '🔍',
    accent: 'indigo',
    hook: 'Find anything in a million in 20 steps 🔍',
    beats: [
      { big: 'Sorted list 🔢', say: 'Start with a sorted list of items.' },
      { big: 'Check the middle', say: 'Look at the middle element first.' },
      { big: '½ each step', say: 'Too big? Go left. Too small? Go right. Halve every time.' },
      { big: '1,000,000 → 20', say: 'A million items? Found in about twenty steps.' },
      { big: 'O(log n) ⚡', say: 'That is the power of binary search.' },
    ],
  },
  {
    id: 'pythagoras-hindi',
    topic: 'Pythagoras — 30 sec mein',
    subject: 'Mathematics',
    language: 'Hindi',
    emoji: '📐',
    accent: 'saffron',
    hook: 'Geometry ka sabse famous formula 👇',
    beats: [
      { big: 'a² + b² = c²', say: 'Kisi bhi right angle triangle mein, do chhoti sides ke square ka sum, sabse badi side ke square ke barabar hota hai.' },
      { big: '3, 4, 5', say: 'Legs hain teen aur chaar. Nau plus solah equals pacchees.' },
      { big: '√25 = 5', say: 'To hypotenuse hua exactly paanch. Bilkul perfect!' },
      { big: '📏 Real life', say: 'Mistri log perfect right angle banane ke liye 3-4-5 use karte hain.' },
      { big: 'Samajh gaye! ✅', say: 'Yahi hai Pythagoras theorem — simple aur powerful.' },
    ],
  },
  {
    id: 'states-matter',
    topic: 'Solid, Liquid, Gas',
    subject: 'Chemistry',
    language: 'English',
    emoji: '🧊',
    accent: 'teal',
    hook: 'Same thing, three forms 🧊💧💨',
    beats: [
      { big: '🧊 Solid', sub: 'tight particles', say: 'In solids, particles are packed tight and fixed.' },
      { big: '💧 Liquid', sub: 'loose particles', say: 'In liquids, they slide past each other and flow.' },
      { big: '💨 Gas', sub: 'free particles', say: 'In gases, they fly around freely, filling all space.' },
      { big: '🔥 Add heat →', say: 'Add energy and matter shifts solid to liquid to gas.' },
      { big: 'Ice floats! 🧊', say: 'Fun fact — ice is lighter than water, so it floats.' },
    ],
  },
  {
    id: 'neural-net',
    topic: 'How AI learns',
    subject: 'Computer Science',
    language: 'English',
    emoji: '🧠',
    accent: 'indigo',
    hook: 'How does ChatGPT actually learn? 🧠',
    beats: [
      { big: '🧠 Neurons', say: 'A neural network is layers of tiny math units called neurons.' },
      { big: 'y = σ(Σwx + b)', say: 'Each neuron multiplies inputs by weights and adds them up.' },
      { big: 'Guess → Error', say: 'It guesses, measures how wrong it is, and adjusts.' },
      { big: '↓ Gradient', say: 'It nudges weights downhill to shrink the error.' },
      { big: 'Repeat 1,000,000× 🔁', say: 'Do this millions of times and it learns. That is AI.' },
    ],
  },
  {
    id: 'trig',
    topic: 'SOH-CAH-TOA',
    subject: 'Mathematics',
    language: 'English',
    emoji: '📐',
    accent: 'saffron',
    hook: 'Never forget trigonometry again 📐',
    beats: [
      { big: 'SOH', sub: 'sin = opp / hyp', say: 'Sine equals opposite over hypotenuse.' },
      { big: 'CAH', sub: 'cos = adj / hyp', say: 'Cosine equals adjacent over hypotenuse.' },
      { big: 'TOA', sub: 'tan = opp / adj', say: 'Tangent equals opposite over adjacent.' },
      { big: 'SOH-CAH-TOA', say: 'Say it out loud — it sticks for life.' },
      { big: 'Trig unlocked 🔓', say: 'Three ratios, infinite problems solved.' },
    ],
  },

  // ─── Mathematics ───────────────────────────────────────────
  {
    id: 'circle-area', topic: 'Area of a Circle', subject: 'Mathematics', language: 'English', emoji: '⭕', accent: 'saffron',
    hook: 'Why π r squared? ⭕',
    beats: [
      { big: 'A = π r²', say: 'The area of a circle is pi times the radius squared.' },
      { big: 'π ≈ 3.14159', say: 'Pi is the ratio of a circle’s circumference to its diameter.' },
      { big: 'r = 5', say: 'Take a radius of five units.' },
      { big: '3.14 × 25 ≈ 78.5', say: 'Pi times twenty-five gives about seventy-eight point five.' },
      { big: 'Round magic ✨', say: 'One little formula measures every circle ever.' },
    ],
  },
  {
    id: 'bodmas', topic: 'BODMAS rule', subject: 'Mathematics', language: 'English', emoji: '🧮', accent: 'indigo',
    hook: 'The #1 maths mistake 🧮',
    beats: [
      { big: 'B O D M A S', say: 'Brackets, Orders, Division, Multiplication, Addition, Subtraction.' },
      { big: '2 + 3 × 4', say: 'Is this fourteen or twenty?' },
      { big: '= 2 + 12', say: 'Multiply first — three times four is twelve.' },
      { big: '= 14 ✅', say: 'So the answer is fourteen, not twenty.' },
      { big: 'Order matters!', say: 'Always follow BODMAS and never lose marks again.' },
    ],
  },
  {
    id: 'prime', topic: 'Prime Numbers', subject: 'Mathematics', language: 'English', emoji: '🔢', accent: 'teal',
    hook: 'The atoms of numbers 🔢',
    beats: [
      { big: '2,3,5,7,11…', say: 'Primes are numbers divisible only by one and themselves.' },
      { big: '2 = only even prime', say: 'Two is the only even prime number.' },
      { big: '12 = 2×2×3', say: 'Every number breaks down into a unique product of primes.' },
      { big: '∞ primes', say: 'Euclid proved there are infinitely many of them.' },
      { big: 'They guard your data 🔐', say: 'Huge primes keep your online payments secure.' },
    ],
  },
  {
    id: 'percentages', topic: 'Percentages fast', subject: 'Mathematics', language: 'English', emoji: '％', accent: 'saffron',
    hook: 'A percentage trick you’ll love ％',
    beats: [
      { big: '18% of 50', say: 'Find eighteen percent of fifty — looks hard, right?' },
      { big: 'x% of y = y% of x', say: 'But percentages flip! Eighteen of fifty equals fifty of eighteen.' },
      { big: '50% of 18', say: 'Fifty percent of eighteen is just half.' },
      { big: '= 9 ✅', say: 'The answer is nine — done in your head.' },
      { big: 'Mind = blown 🤯', say: 'Flip the percentage and the maths gets easy.' },
    ],
  },
  {
    id: 'compound-interest', topic: 'Compound Interest', subject: 'Mathematics', language: 'English', emoji: '💰', accent: 'teal',
    hook: 'The 8th wonder of the world 💰',
    beats: [
      { big: 'A = P(1+r)ⁿ', say: 'Compound interest grows on interest already earned.' },
      { big: '₹100 at 10%', say: 'A hundred rupees at ten percent.' },
      { big: 'Yr1: ₹110', say: 'After one year, a hundred and ten.' },
      { big: 'Yr2: ₹121', say: 'Year two earns interest on the interest too.' },
      { big: 'Start early! ⏰', say: 'Time is the secret ingredient of compounding.' },
    ],
  },
  {
    id: 'fibonacci', topic: 'Fibonacci & Nature', subject: 'Mathematics', language: 'English', emoji: '🌻', accent: 'indigo',
    hook: 'Nature’s favourite numbers 🌻',
    beats: [
      { big: '0,1,1,2,3,5,8,13', say: 'Each number is the sum of the two before it.' },
      { big: '5 + 8 = 13', say: 'Five plus eight gives thirteen — and it continues forever.' },
      { big: '🌻 🐚 🌀', say: 'Sunflowers, shells and galaxies follow this pattern.' },
      { big: 'ratio → 1.618', say: 'The ratio approaches the golden ratio, phi.' },
      { big: 'Maths in nature 🍃', say: 'Numbers are literally growing all around you.' },
    ],
  },
  {
    id: 'pi-day', topic: 'What is π?', subject: 'Mathematics', language: 'English', emoji: '🥧', accent: 'saffron',
    hook: 'The most famous number 🥧',
    beats: [
      { big: 'π = C / d', say: 'Pi is any circle’s circumference divided by its diameter.' },
      { big: '≈ 3.14159…', say: 'It starts three point one four and never repeats.' },
      { big: 'Irrational ∞', say: 'Its digits go on forever with no pattern.' },
      { big: '50 trillion digits', say: 'Computers have calculated trillions of digits.' },
      { big: 'Same for every circle ⭕', say: 'Big or small, pi is always the same. Beautiful!' },
    ],
  },
  {
    id: 'logarithms', topic: 'Logarithms simplified', subject: 'Mathematics', language: 'English', emoji: '📈', accent: 'indigo',
    hook: 'Logs are just reverse powers 📈',
    beats: [
      { big: '10² = 100', say: 'Ten squared is one hundred.' },
      { big: 'log₁₀100 = 2', say: 'So log base ten of a hundred is two.' },
      { big: '“What power?”', say: 'A logarithm just asks: what power gives this number?' },
      { big: '🔊 dB, pH, Richter', say: 'Sound, acidity and earthquakes all use log scales.' },
      { big: 'Not scary 😌', say: 'Logs simply undo exponents. That’s it.' },
    ],
  },
  {
    id: 'mean-median-mode', topic: 'Mean, Median, Mode', subject: 'Mathematics', language: 'English', emoji: '📊', accent: 'teal',
    hook: 'Three averages in 30s 📊',
    beats: [
      { big: '2,3,3,6,11', say: 'Take these five numbers.' },
      { big: 'Mean = 5', say: 'Mean: add them and divide — twenty-five over five is five.' },
      { big: 'Median = 3', say: 'Median: the middle value when sorted is three.' },
      { big: 'Mode = 3', say: 'Mode: the most frequent value is also three.' },
      { big: 'Stats unlocked 📈', say: 'Three different ways to find the centre of data.' },
    ],
  },
  {
    id: 'infinity', topic: 'Some infinities are bigger', subject: 'Mathematics', language: 'English', emoji: '♾️', accent: 'indigo',
    hook: 'Mind-bending maths fact ♾️',
    beats: [
      { big: '♾️ > ♾️ ?', say: 'Believe it or not, some infinities are larger than others.' },
      { big: '1,2,3… counting', say: 'The counting numbers are infinite.' },
      { big: '0.1, 0.11, 0.111…', say: 'But the numbers between zero and one are a bigger infinity.' },
      { big: 'Cantor proved it', say: 'Georg Cantor proved this in the 1800s.' },
      { big: 'Brain melted 🫠', say: 'Infinity comes in different sizes. Wild!' },
    ],
  },

  // ─── Physics ───────────────────────────────────────────────
  {
    id: 'speed-light', topic: 'Speed of Light', subject: 'Physics', language: 'English', emoji: '💡', accent: 'indigo',
    hook: 'The universe’s speed limit 💡',
    beats: [
      { big: '3 × 10⁸ m/s', say: 'Light travels three hundred million metres every second.' },
      { big: '🌍 → 🌙 in 1.3s', say: 'It reaches the Moon in just over one second.' },
      { big: '☀️ → 🌍 = 8 min', say: 'Sunlight takes about eight minutes to reach us.' },
      { big: 'Nothing goes faster', say: 'No object with mass can ever match it.' },
      { big: 'Cosmic limit 🚀', say: 'It’s the ultimate speed limit of the universe.' },
    ],
  },
  {
    id: 'friction', topic: 'Friction', subject: 'Physics', language: 'English', emoji: '🛑', accent: 'saffron',
    hook: 'The force you fight daily 🛑',
    beats: [
      { big: 'Friction opposes motion', say: 'Friction is the force that resists movement between surfaces.' },
      { big: '🚶 walk = friction', say: 'Without it, you couldn’t even walk — you’d slip.' },
      { big: 'Rough > smooth', say: 'Rougher surfaces create more friction.' },
      { big: '🔥 makes heat', say: 'Rub your hands — friction turns motion into heat.' },
      { big: 'Friend & foe ⚖️', say: 'It slows machines but lets us grip the world.' },
    ],
  },
  {
    id: 'momentum', topic: 'Momentum', subject: 'Physics', language: 'English', emoji: '🎳', accent: 'indigo',
    hook: 'Why a truck beats a bicycle 🎳',
    beats: [
      { big: 'p = m × v', say: 'Momentum equals mass times velocity.' },
      { big: '🚚 heavy + fast', say: 'A heavy fast object carries huge momentum.' },
      { big: 'Hard to stop', say: 'The more momentum, the harder it is to stop.' },
      { big: 'Conserved 🔒', say: 'In collisions, total momentum stays the same.' },
      { big: 'Newton’s gift 🎁', say: 'It explains crashes, rockets, and billiards.' },
    ],
  },
  {
    id: 'pressure', topic: 'Pressure', subject: 'Physics', language: 'English', emoji: '🔪', accent: 'teal',
    hook: 'Why knives are sharp 🔪',
    beats: [
      { big: 'P = F / A', say: 'Pressure is force divided by area.' },
      { big: 'Small area → big P', say: 'Squeeze force into a tiny area and pressure shoots up.' },
      { big: '🔪 thin edge', say: 'A sharp blade has a tiny area, so it cuts easily.' },
      { big: '🐫 wide feet', say: 'Camels have wide feet to lower pressure on sand.' },
      { big: 'Spread or focus ⚖️', say: 'Change the area, change the pressure.' },
    ],
  },
  {
    id: 'sound', topic: 'How sound travels', subject: 'Physics', language: 'English', emoji: '🔊', accent: 'saffron',
    hook: 'Sound is invisible waves 🔊',
    beats: [
      { big: '🔊 vibrations', say: 'Sound is vibrations travelling through a medium.' },
      { big: '343 m/s in air', say: 'It moves at about three hundred forty metres per second.' },
      { big: 'No air = no sound', say: 'In space, there’s no medium — so it’s totally silent.' },
      { big: 'Faster in water 🌊', say: 'Sound travels even faster through water and solids.' },
      { big: 'Thunder lag ⚡', say: 'That’s why you see lightning before you hear it.' },
    ],
  },
  {
    id: 'black-hole', topic: 'Black Holes', subject: 'Physics', language: 'English', emoji: '🕳️', accent: 'indigo',
    hook: 'Where even light can’t escape 🕳️',
    beats: [
      { big: '🕳️ infinite gravity', say: 'A black hole packs huge mass into a tiny point.' },
      { big: 'Light can’t escape', say: 'Its gravity is so strong even light can’t get out.' },
      { big: 'Event horizon', say: 'Cross the edge and there’s no coming back.' },
      { big: '⏳ time slows', say: 'Near it, time itself slows down dramatically.' },
      { big: 'Real & proven 📸', say: 'We photographed one in 2019. They’re real!' },
    ],
  },
  {
    id: 'density', topic: 'Why ships float', subject: 'Physics', language: 'English', emoji: '🚢', accent: 'teal',
    hook: 'Steel floats but a coin sinks? 🚢',
    beats: [
      { big: 'Density = mass / volume', say: 'Density is how much mass fits in a given volume.' },
      { big: '🪙 dense → sinks', say: 'A coin is dense, so it sinks.' },
      { big: '🚢 hollow → floats', say: 'A ship is mostly air inside, lowering its density.' },
      { big: '< water density', say: 'If average density is less than water, it floats.' },
      { big: 'Archimedes knew 🛁', say: 'Buoyancy keeps giant steel ships on top.' },
    ],
  },
  {
    id: 'relativity-time', topic: 'Time Dilation', subject: 'Physics', language: 'English', emoji: '⏳', accent: 'indigo',
    hook: 'Astronauts age slower ⏳',
    beats: [
      { big: 'Faster → slower time', say: 'The faster you move, the slower your time passes.' },
      { big: 'Einstein 1905', say: 'Einstein discovered this in special relativity.' },
      { big: '🛰️ GPS adjusts', say: 'GPS satellites correct for it every single day.' },
      { big: 'Twins paradox 👯', say: 'A travelling twin returns younger than the other.' },
      { big: 'Time isn’t fixed ⌛', say: 'Time bends with speed and gravity. Mind-blowing!' },
    ],
  },

  // ─── Chemistry ─────────────────────────────────────────────
  {
    id: 'water-molecule', topic: 'Why water is special', subject: 'Chemistry', language: 'English', emoji: '💧', accent: 'teal',
    hook: 'The molecule of life 💧',
    beats: [
      { big: 'H₂O', say: 'Water is two hydrogens bonded to one oxygen.' },
      { big: 'Bent + polar', say: 'Its bent shape makes one side positive, one negative.' },
      { big: '🧲 sticks together', say: 'That polarity lets water molecules cling to each other.' },
      { big: '🧊 ice floats', say: 'Solid water is lighter than liquid — so ice floats.' },
      { big: 'Life needs it 🌍', say: 'These quirks make water perfect for life.' },
    ],
  },
  {
    id: 'ph-scale', topic: 'The pH scale', subject: 'Chemistry', language: 'English', emoji: '🧪', accent: 'saffron',
    hook: 'Acid or base? 🧪',
    beats: [
      { big: '0 — 7 — 14', say: 'The pH scale runs from zero to fourteen.' },
      { big: '< 7 acidic 🍋', say: 'Below seven is acidic — like lemon juice.' },
      { big: '7 neutral 💧', say: 'Seven is neutral — pure water.' },
      { big: '> 7 basic 🧼', say: 'Above seven is basic — like soap.' },
      { big: 'Your blood = 7.4', say: 'Your body keeps blood at a steady seven point four.' },
    ],
  },
  {
    id: 'atom', topic: 'Inside an Atom', subject: 'Chemistry', language: 'English', emoji: '⚛️', accent: 'indigo',
    hook: 'You are 99.9% empty space ⚛️',
    beats: [
      { big: '⚛️ tiny nucleus', say: 'An atom has a tiny dense nucleus at its centre.' },
      { big: 'protons + neutrons', say: 'The nucleus holds protons and neutrons.' },
      { big: 'electrons orbit', say: 'Electrons whizz around in a vast empty cloud.' },
      { big: '99.9% empty', say: 'Almost all of an atom is empty space.' },
      { big: 'You = mostly nothing 😮', say: 'So technically, you’re mostly empty space!' },
    ],
  },
  {
    id: 'noble-gases', topic: 'Noble Gases', subject: 'Chemistry', language: 'English', emoji: '🎈', accent: 'teal',
    hook: 'The loners of chemistry 🎈',
    beats: [
      { big: 'He Ne Ar Kr Xe', say: 'Helium, neon, argon — the noble gases.' },
      { big: 'Full outer shell', say: 'Their outer electron shells are completely full.' },
      { big: 'Won’t react 🚫', say: 'So they almost never bond with anything.' },
      { big: '💡 neon signs', say: 'Neon glows red, giving us colourful signs.' },
      { big: 'Happy & stable 😎', say: 'They’re the chillest elements on the table.' },
    ],
  },
  {
    id: 'combustion', topic: 'Fire & Combustion', subject: 'Chemistry', language: 'English', emoji: '🔥', accent: 'saffron',
    hook: 'What is fire, really? 🔥',
    beats: [
      { big: 'Fuel + O₂ + heat', say: 'Fire needs three things: fuel, oxygen, and heat.' },
      { big: '→ CO₂ + H₂O + 🔥', say: 'They react, releasing carbon dioxide, water, and energy.' },
      { big: 'Remove one →', say: 'Take away any one and the fire dies.' },
      { big: '🧯 cuts oxygen', say: 'An extinguisher smothers the oxygen.' },
      { big: 'The fire triangle 🔺', say: 'Break the triangle, stop the flame.' },
    ],
  },

  // ─── Biology ───────────────────────────────────────────────
  {
    id: 'brain', topic: 'Your Brain', subject: 'Biology', language: 'English', emoji: '🧠', accent: 'indigo',
    hook: 'The most complex object known 🧠',
    beats: [
      { big: '86 billion neurons', say: 'Your brain has about eighty-six billion neurons.' },
      { big: '⚡ 100 m/s signals', say: 'They fire signals at up to a hundred metres per second.' },
      { big: '20% of energy', say: 'It uses a fifth of your body’s energy.' },
      { big: '🔌 ~20 watts', say: 'Yet it runs on roughly twenty watts — like a dim bulb.' },
      { big: 'Supercomputer 🧠', say: 'No computer matches its efficiency. Yet.' },
    ],
  },
  {
    id: 'immune', topic: 'Your Immune System', subject: 'Biology', language: 'English', emoji: '🛡️', accent: 'teal',
    hook: 'Your body’s secret army 🛡️',
    beats: [
      { big: '🦠 invader detected', say: 'A germ enters your body.' },
      { big: 'White blood cells 🛡️', say: 'White blood cells rush to attack it.' },
      { big: 'Antibodies lock on', say: 'Antibodies tag the invader for destruction.' },
      { big: '🧠 memory cells', say: 'Memory cells remember it for next time.' },
      { big: 'That’s vaccines 💉', say: 'Vaccines train this army without you getting sick.' },
    ],
  },
  {
    id: 'evolution', topic: 'Evolution', subject: 'Biology', language: 'English', emoji: '🐒', accent: 'saffron',
    hook: 'How life changes over time 🐒',
    beats: [
      { big: 'Variation 🧬', say: 'Living things vary — no two are exactly alike.' },
      { big: 'Survival of the fit', say: 'Those best suited to their environment survive.' },
      { big: 'Pass on genes', say: 'Survivors pass their helpful traits to offspring.' },
      { big: 'Over millions of yrs', say: 'Tiny changes add up over millions of years.' },
      { big: 'Darwin’s big idea 🌿', say: 'That’s natural selection — evolution in action.' },
    ],
  },
  {
    id: 'heart-short', topic: 'Your Heart', subject: 'Biology', language: 'English', emoji: '❤️', accent: 'saffron',
    hook: 'A pump that never rests ❤️',
    beats: [
      { big: '❤️ 4 chambers', say: 'Your heart has four chambers working together.' },
      { big: '100,000 beats/day', say: 'It beats about a hundred thousand times a day.' },
      { big: '5 litres / min', say: 'It pumps roughly five litres of blood every minute.' },
      { big: '🩸 to every cell', say: 'Delivering oxygen to every cell in your body.' },
      { big: 'Never stops 💪', say: 'A lifetime of work without a single break.' },
    ],
  },
  {
    id: 'bacteria-virus', topic: 'Bacteria vs Virus', subject: 'Biology', language: 'English', emoji: '🦠', accent: 'teal',
    hook: 'They’re NOT the same 🦠',
    beats: [
      { big: '🦠 Bacteria = alive', say: 'Bacteria are living cells that can survive alone.' },
      { big: '🧬 Virus = not quite', say: 'A virus is just genetic code in a shell.' },
      { big: 'Virus needs a host', say: 'It can only reproduce inside your cells.' },
      { big: '💊 antibiotics ≠ virus', say: 'Antibiotics kill bacteria, not viruses.' },
      { big: 'Know the difference 🧠', say: 'That’s why a cold can’t be cured by antibiotics.' },
    ],
  },

  // ─── Computer Science ──────────────────────────────────────
  {
    id: 'binary', topic: 'Binary Numbers', subject: 'Computer Science', language: 'English', emoji: '💻', accent: 'indigo',
    hook: 'Computers only know 0 and 1 💻',
    beats: [
      { big: '0 / 1', say: 'Computers store everything as zeros and ones.' },
      { big: '1011 = 11', say: 'In binary, one-zero-one-one means eleven.' },
      { big: '8 bits = 1 byte', say: 'Eight of these bits make one byte.' },
      { big: '🔌 on / off', say: 'Each bit is just a switch — on or off.' },
      { big: 'Your whole world 🌐', say: 'Photos, music, this video — all just ones and zeros.' },
    ],
  },
  {
    id: 'big-o', topic: 'Big-O Notation', subject: 'Computer Science', language: 'English', emoji: '⏱️', accent: 'saffron',
    hook: 'How fast is your code? ⏱️',
    beats: [
      { big: 'O(1)', say: 'O of one — instant, no matter the size.' },
      { big: 'O(n)', say: 'O of n — time grows with the input.' },
      { big: 'O(log n) ⚡', say: 'O of log n — super fast, like binary search.' },
      { big: 'O(n²) 🐌', say: 'O of n squared — slows down badly as data grows.' },
      { big: 'Think before coding 🧠', say: 'Big-O tells you if your code will scale.' },
    ],
  },
  {
    id: 'encryption', topic: 'Encryption', subject: 'Computer Science', language: 'English', emoji: '🔐', accent: 'teal',
    hook: 'How your messages stay secret 🔐',
    beats: [
      { big: '“Hello” → x9#@z', say: 'Encryption scrambles your message into gibberish.' },
      { big: '🔑 needs a key', say: 'Only someone with the key can unscramble it.' },
      { big: 'Public + private', say: 'Modern systems use a public and a private key pair.' },
      { big: '🔒 https', say: 'That little lock in your browser? That’s encryption.' },
      { big: 'Privacy protected 🛡️', say: 'It keeps your passwords and chats safe.' },
    ],
  },
  {
    id: 'how-internet', topic: 'How the Internet works', subject: 'Computer Science', language: 'English', emoji: '🌐', accent: 'indigo',
    hook: 'What happens when you click? 🌐',
    beats: [
      { big: 'Your device → request', say: 'Your device asks for a web page.' },
      { big: '📦 packets', say: 'Data is split into tiny packets.' },
      { big: 'Travel via servers', say: 'They hop across servers around the world.' },
      { big: 'IP = address', say: 'Each device has an IP address, like a postal code.' },
      { big: 'Reassembled in ms ⚡', say: 'Packets arrive and rebuild the page in milliseconds.' },
    ],
  },
  {
    id: 'recursion-short', topic: 'Recursion', subject: 'Computer Science', language: 'English', emoji: '🔁', accent: 'saffron',
    hook: 'A function that calls itself 🔁',
    beats: [
      { big: 'f(n) = n × f(n-1)', say: 'A recursive function calls itself on a smaller problem.' },
      { big: 'Base case 🛑', say: 'It needs a stopping point — the base case.' },
      { big: '🪆 like nesting dolls', say: 'Think Russian dolls — each opens a smaller one.' },
      { big: 'Stack builds up', say: 'Calls stack up, then unwind to the answer.' },
      { big: 'Elegant but careful ⚠️', say: 'Forget the base case and it loops forever!' },
    ],
  },

  // ─── Space & Earth ─────────────────────────────────────────
  {
    id: 'solar-system', topic: 'The Solar System', subject: 'Physics', language: 'English', emoji: '🪐', accent: 'indigo',
    hook: 'Our cosmic neighbourhood 🪐',
    beats: [
      { big: '☀️ + 8 planets', say: 'The Sun and eight planets make our solar system.' },
      { big: 'My Very Easy Method', say: 'Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune.' },
      { big: '🪐 Jupiter = biggest', say: 'Jupiter is so big, all others fit inside it.' },
      { big: '☀️ 99.8% of mass', say: 'The Sun holds almost all the system’s mass.' },
      { big: 'Tiny blue dot 🌍', say: 'And Earth — our only home — is just a speck.' },
    ],
  },
  {
    id: 'water-cycle', topic: 'The Water Cycle', subject: 'Biology', language: 'English', emoji: '🌧️', accent: 'teal',
    hook: 'The same water, forever 🌧️',
    beats: [
      { big: '☀️ Evaporation', say: 'The Sun heats water and it rises as vapour.' },
      { big: '☁️ Condensation', say: 'Up high it cools and forms clouds.' },
      { big: '🌧️ Precipitation', say: 'It falls back as rain or snow.' },
      { big: '🏞️ Collection', say: 'Water gathers in rivers, lakes and oceans.' },
      { big: '🔁 Repeat forever', say: 'You might be drinking water a dinosaur once did!' },
    ],
  },
  {
    id: 'seasons', topic: 'Why we have Seasons', subject: 'Physics', language: 'English', emoji: '🍂', accent: 'saffron',
    hook: 'It’s NOT about distance 🍂',
    beats: [
      { big: '🌍 tilted 23.5°', say: 'Earth spins on a tilted axis of about twenty-three degrees.' },
      { big: 'Tilt → sun angle', say: 'The tilt changes how directly sunlight hits us.' },
      { big: '☀️ direct = summer', say: 'Direct rays mean summer.' },
      { big: '🌥️ slanted = winter', say: 'Slanted rays mean winter.' },
      { big: 'Tilt, not distance 🌍', say: 'So seasons come from the tilt, not the distance to the Sun.' },
    ],
  },

  // ─── English / Language ────────────────────────────────────
  {
    id: 'tenses', topic: 'English Tenses', subject: 'General', language: 'English', emoji: '⏰', accent: 'indigo',
    hook: 'Past, present, future in 30s ⏰',
    beats: [
      { big: 'I eat 🍽️', say: 'Present — I eat every day.' },
      { big: 'I ate', say: 'Past — I ate yesterday.' },
      { big: 'I will eat', say: 'Future — I will eat tomorrow.' },
      { big: 'I am eating', say: 'Continuous — I am eating right now.' },
      { big: 'Time = tense ⏳', say: 'Tense simply tells you when the action happens.' },
    ],
  },
  {
    id: 'active-passive', topic: 'Active vs Passive', subject: 'General', language: 'English', emoji: '✍️', accent: 'saffron',
    hook: 'A grammar glow-up ✍️',
    beats: [
      { big: 'Active 💪', say: 'Active voice: the subject does the action.' },
      { big: '“Riya kicked the ball”', say: 'Riya kicked the ball — clear and direct.' },
      { big: 'Passive 😴', say: 'Passive voice: the action happens to the subject.' },
      { big: '“The ball was kicked”', say: 'The ball was kicked by Riya — softer focus.' },
      { big: 'Active = stronger ⚡', say: 'For punchy writing, prefer the active voice.' },
    ],
  },

  // ─── Economics / GK ────────────────────────────────────────
  {
    id: 'supply-demand', topic: 'Supply & Demand', subject: 'General', language: 'English', emoji: '⚖️', accent: 'teal',
    hook: 'Why prices change ⚖️',
    beats: [
      { big: '📈 Demand up', say: 'When more people want something, demand rises.' },
      { big: 'Price ↑', say: 'High demand pushes the price up.' },
      { big: '📦 Supply up', say: 'When there’s plenty of it, supply rises.' },
      { big: 'Price ↓', say: 'High supply pushes the price down.' },
      { big: 'They balance ⚖️', say: 'Price settles where supply meets demand.' },
    ],
  },
  {
    id: 'inflation', topic: 'Inflation', subject: 'General', language: 'English', emoji: '🎈', accent: 'saffron',
    hook: 'Why ₹10 buys less today 🎈',
    beats: [
      { big: '💰 more money', say: 'When more money chases the same goods…' },
      { big: 'prices rise 📈', say: 'prices slowly climb — that’s inflation.' },
      { big: '🍫 ₹5 → ₹20', say: 'A chocolate that cost five rupees now costs twenty.' },
      { big: 'Value of money ↓', say: 'Your money buys a little less each year.' },
      { big: 'Invest to beat it 📊', say: 'That’s why people invest instead of just saving.' },
    ],
  },
  {
    id: 'gdp', topic: 'What is GDP?', subject: 'General', language: 'English', emoji: '🏭', accent: 'indigo',
    hook: 'How we measure a country 🏭',
    beats: [
      { big: 'GDP', say: 'GDP is the total value of everything a country produces.' },
      { big: '🏭 goods + services', say: 'It adds up all goods and services in a year.' },
      { big: 'Higher = richer?', say: 'A bigger GDP usually means a bigger economy.' },
      { big: 'Per capita 👥', say: 'Divide by population to see average wealth.' },
      { big: 'One big scoreboard 📊', say: 'It’s the world’s economic scoreboard.' },
    ],
  },

  // ─── Hindi / Regional reels ────────────────────────────────
  {
    id: 'newton-hindi', topic: "Newton ka Teesra Niyam", subject: 'Physics', language: 'Hindi', emoji: '🚀', accent: 'indigo',
    hook: 'Rocket kaise udta hai? 🚀',
    beats: [
      { big: 'Action = Reaction', say: 'Har action ka barabar aur opposite reaction hota hai.' },
      { big: '🔥 gas neeche', say: 'Rocket garam gas ko neeche dhakelta hai.' },
      { big: 'Rocket upar ⬆️', say: 'Aur gas rocket ko upar dhakel deti hai.' },
      { big: '🏊 swimming bhi', say: 'Paani ko peeche dhakelo, paani tumhe aage bhejta hai.' },
      { big: 'Physics kamaal hai ✨', say: 'Yahi hai Newton ka teesra niyam.' },
    ],
  },
  {
    id: 'photosynthesis-hindi', topic: 'Paudhe khana kaise banate hain', subject: 'Biology', language: 'Hindi', emoji: '🌱', accent: 'teal',
    hook: 'Paudhe dhoop khaate hain 🌞',
    beats: [
      { big: '🌞 + 💧 + CO₂', say: 'Paudhe sunlight, paani aur carbon dioxide lete hain.' },
      { big: 'Chlorophyll', say: 'Hara chlorophyll suraj ki energy pakadta hai.' },
      { big: '→ 🍬 + O₂', say: 'Aur banta hai glucose — unka khana — plus oxygen.' },
      { big: 'Hum saans lete 🫁', say: 'Wahi oxygen jo aap abhi saans le rahe ho.' },
      { big: 'Paudhon ka shukriya 🌿', say: 'Paudhe hi prakriti ki solar factory hain.' },
    ],
  },
  {
    id: 'gravity-hindi', topic: 'Cheezein neeche kyun girti hain', subject: 'Physics', language: 'Hindi', emoji: '🍎', accent: 'indigo',
    hook: 'Ek seb ne duniya badal di 🍎',
    beats: [
      { big: 'Gravity 🌍', say: 'Har cheez doosri cheez ko apni taraf kheechti hai.' },
      { big: '🍎 ↓', say: 'Dharti seb ko neeche kheechti hai — isi ko gravity kehte hain.' },
      { big: '🌙 ghoomta 🌍', say: 'Yahi force chaand ko dharti ke around ghumata hai.' },
      { big: '2× door = ¼ force', say: 'Doori dugni karo to force chautha reh jata hai.' },
      { big: 'Ek niyam, poora brahmand 🌌', say: 'Seb se taaron tak — gravity sab par raaj karti hai.' },
    ],
  },
  {
    id: 'prime-hindi', topic: 'Bhajya aur Akhand sankhya', subject: 'Mathematics', language: 'Hindi', emoji: '🔢', accent: 'saffron',
    hook: 'Numbers ke parmaanu 🔢',
    beats: [
      { big: '2,3,5,7,11…', say: 'Prime numbers sirf ek aur khud se divide hote hain.' },
      { big: '2 = only even', say: 'Do hi ekmatra even prime number hai.' },
      { big: '12 = 2×2×3', say: 'Har number primes ke product mein toota ja sakta hai.' },
      { big: '∞ primes', say: 'Euclid ne saabit kiya — ye infinite hain.' },
      { big: 'Data ki suraksha 🔐', say: 'Bade primes aapke online payment ko surakshit rakhte hain.' },
    ],
  },
  {
    id: 'states-hindi', topic: 'Thos, Drav, Gas', subject: 'Chemistry', language: 'Hindi', emoji: '🧊', accent: 'teal',
    hook: 'Ek hi cheez, teen roop 🧊💧💨',
    beats: [
      { big: '🧊 Thos', say: 'Thos mein particles bahut paas aur fixed hote hain.' },
      { big: '💧 Drav', say: 'Drav mein wo slide karte hain, isliye behte hain.' },
      { big: '💨 Gas', say: 'Gas mein wo aazaad ud-te hain, poori jagah bhar dete hain.' },
      { big: '🔥 garmi se badlav', say: 'Garmi do to thos se drav, drav se gas ban jata hai.' },
      { big: 'Baraf tairti hai! 🧊', say: 'Mazedaar baat — baraf paani se halki hoti hai.' },
    ],
  },

  // ─── A few more bangers ────────────────────────────────────
  {
    id: 'golden-ratio', topic: 'The Golden Ratio', subject: 'Mathematics', language: 'English', emoji: '🌀', accent: 'saffron',
    hook: 'The most beautiful number 🌀',
    beats: [
      { big: 'φ ≈ 1.618', say: 'The golden ratio, phi, is about one point six one eight.' },
      { big: 'a/b = (a+b)/a', say: 'It appears when a ratio repeats itself perfectly.' },
      { big: '🌻 🐚 🖼️', say: 'It shows up in flowers, shells, and famous art.' },
      { big: 'Mona Lisa, Parthenon', say: 'Artists and architects use it for beauty.' },
      { big: 'Nature’s aesthetic ✨', say: 'It seems the universe finds it pleasing too.' },
    ],
  },
  {
    id: 'electromagnet', topic: 'Electromagnets', subject: 'Physics', language: 'English', emoji: '🧲', accent: 'indigo',
    hook: 'Electricity makes magnets 🧲',
    beats: [
      { big: '⚡ current → 🧲', say: 'A flowing current creates a magnetic field.' },
      { big: 'Coil it up 🌀', say: 'Wrap the wire in a coil to make it stronger.' },
      { big: 'Switch on / off', say: 'Unlike normal magnets, you can turn it off.' },
      { big: '🏗️ lifts cars', say: 'Giant ones lift cars in scrapyards.' },
      { big: 'Motors & maglev 🚄', say: 'They power motors and floating trains.' },
    ],
  },
  {
    id: 'mole-short', topic: 'The Mole (chemistry)', subject: 'Chemistry', language: 'English', emoji: '🔬', accent: 'teal',
    hook: 'A chemist’s dozen 🔬',
    beats: [
      { big: '1 mole = 6.022×10²³', say: 'A mole is just a huge counting number for atoms.' },
      { big: 'like “a dozen”', say: 'Just like a dozen means twelve, a mole means this.' },
      { big: 'water: 18 g = 1 mol', say: 'Eighteen grams of water is exactly one mole.' },
      { big: 'n = m / M', say: 'Moles equal mass divided by molar mass.' },
      { big: 'Counting atoms 🧮', say: 'It lets us count invisible atoms by weighing them.' },
    ],
  },
  {
    id: 'derivative', topic: 'What is a Derivative?', subject: 'Mathematics', language: 'English', emoji: '📉', accent: 'indigo',
    hook: 'Calculus in 30 seconds 📉',
    beats: [
      { big: 'd/dx', say: 'A derivative measures how fast something changes.' },
      { big: '🚗 speed = d(dist)/dt', say: 'Your speed is the derivative of distance over time.' },
      { big: 'slope of a curve', say: 'Graphically, it’s the slope at any point on a curve.' },
      { big: 'steep → big rate', say: 'Steeper slope means faster change.' },
      { big: 'Change, measured 📈', say: 'Calculus is just the maths of change.' },
    ],
  },
  {
    id: 'electricity-safety', topic: 'Why birds don’t get shocked', subject: 'Physics', language: 'English', emoji: '🐦', accent: 'saffron',
    hook: 'Birds on live wires?! 🐦',
    beats: [
      { big: '🐦 on one wire', say: 'A bird sits safely on a single power line.' },
      { big: 'No path to ground', say: 'Current only flows if there’s a path to follow.' },
      { big: 'Same voltage = no flow', say: 'Both feet are at the same voltage, so nothing flows.' },
      { big: '⚠️ touch 2 wires', say: 'Touch two wires and current would rush through.' },
      { big: 'Circuits need a loop 🔁', say: 'No complete circuit, no shock. Clever physics!' },
    ],
  },
];

// Full feed = curated core reels + the large extra library.
export const SHORTS: Short[] = [...CORE_SHORTS, ...EXTRA_SHORTS];
