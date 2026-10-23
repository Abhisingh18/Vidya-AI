// Shorts feed: hand-written visual reels — photos and diagrams from Wikimedia
// Commons (credited on screen), a headline and one narrated line per scene, in
// English and Hindi (other languages are translated on demand). Narration is
// spoken by the server voice (/api/tts), so it works without browser voices.

import type { MotionKind } from './motion';

export type ReelLang = 'en' | 'hi';
export interface ReelText { en: string; hi: string }

export interface ReelImage {
  src: string;
  credit: string;
  license: string;
  /** Commons file page (attribution link). */
  page: string;
  /** cover: fills the frame (slow Ken Burns zoom); contain: whole image on a blurred backdrop (diagrams). */
  fit: 'cover' | 'contain';
}

export interface ReelMotion {
  kind: MotionKind;
  axis?: 'x' | 'y';
  items: { emoji: string; label: ReelText }[];
}

/** Animated diagram drawn over (or instead of) the image. */
export type ReelOverlay = 'pyth-triangle' | 'pyth-squares' | 'pyth-345' | 'vibgyor' | 'charges' | 'winds' | 'half-half';

export interface ReelScene {
  image?: ReelImage;
  overlay?: ReelOverlay;
  /** Big on-screen line; *word* marks the accent word. */
  headline: ReelText;
  /** Narration (also the caption). */
  say: ReelText;
  /** Giant number / formula shown with the headline. */
  stat?: ReelText;
  /** Ken Burns direction for cover images (default: slow zoom in). */
  pan?: 'up';
  /** An animation (lib/motion.ts) that shows the idea moving, in place of the picture; steps advance with the narration. */
  motion?: ReelMotion;
}

export interface Reel {
  id: string;
  subject: string;
  emoji: string;
  accent: 'saffron' | 'indigo' | 'teal';
  title: ReelText;
  /** Topic for the "Full lesson" link. */
  topic: string;
  scenes: ReelScene[];
}

export const REELS: Reel[] = [
  {
    id: "photosynthesis", subject: "Biology", emoji: "🌱", accent: "teal", topic: "Photosynthesis",
    title: { en: "How plants eat sunlight", hi: "पौधे धूप कैसे खाते हैं?" },
    scenes: [
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7d/Looking_up_into_a_dense_green_forest_canopy.jpg/960px-Looking_up_into_a_dense_green_forest_canopy.jpg", fit: "cover",
          credit: "Krishna k. sahh", license: "CC0", page: "https://commons.wikimedia.org/wiki/File:Looking_up_into_a_dense_green_forest_canopy.jpg" },
        headline: { en: "Plants *eat* sunlight", hi: "पौधे *धूप* खाते हैं" },
        pan: "up",
        say: {
          en: "Plants never go shopping for food. They make it themselves, using sunlight!",
          hi: "पौधे खाना ख़रीदने बाज़ार नहीं जाते। वे अपना खाना ख़ुद बनाते हैं — धूप से!",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c7/Taro_leaf_underside%2C_backlit_by_sun_-_edit.jpg/1280px-Taro_leaf_underside%2C_backlit_by_sun_-_edit.jpg", fit: "cover",
          credit: "Avenue Derivative w", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Taro_leaf_underside,_backlit_by_sun_-_edit.jpg" },
        headline: { en: "Every leaf is a *kitchen*", hi: "हर पत्ती एक *रसोई*" },
        say: {
          en: "Every leaf is a tiny kitchen, packed with millions of green cells.",
          hi: "हर पत्ती एक छोटी-सी रसोई है, जिसमें लाखों हरी कोशिकाएँ भरी होती हैं।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/be/Lime_chloroplasts.jpg/960px-Lime_chloroplasts.jpg", fit: "contain",
          credit: "Mjolk1", license: "CC0", page: "https://commons.wikimedia.org/wiki/File:Lime_chloroplasts.jpg" },
        headline: { en: "Meet *chloroplasts*", hi: "ये हैं *क्लोरोप्लास्ट*" },
        say: {
          en: "Inside them are chloroplasts. Their green chlorophyll traps the energy of sunlight.",
          hi: "इनके अंदर होते हैं क्लोरोप्लास्ट। इनका हरा क्लोरोफ़िल धूप की ऊर्जा को पकड़ लेता है।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/74/Kiental_entre_Herrsching_y_Andechs%2C_Alemania_2012-05-01%2C_DD_12.JPG/1280px-Kiental_entre_Herrsching_y_Andechs%2C_Alemania_2012-05-01%2C_DD_12.JPG", fit: "cover",
          credit: "Diego Delso", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Kiental_entre_Herrsching_y_Andechs,_Alemania_2012-05-01,_DD_12.JPG" },
        headline: { en: "The *recipe*", hi: "खाने की *रेसिपी*" },
        motion: { kind: "reaction", items: [{ emoji: "💧", label: { en: "Water", hi: "पानी" } }, { emoji: "💨", label: { en: "Carbon dioxide", hi: "कार्बन डाइऑक्साइड" } }, { emoji: "🍬", label: { en: "Sugar", hi: "शक्कर" } }, { emoji: "🫧", label: { en: "Oxygen", hi: "ऑक्सीजन" } }] },
        say: {
          en: "Water comes up from the roots, and carbon dioxide comes in from the air. Sunlight joins them into sugar, and oxygen is set free!",
          hi: "जड़ों से पानी आता है, और हवा से कार्बन डाइऑक्साइड। धूप इन्हें जोड़कर शक्कर बना देती है, और ऑक्सीजन आज़ाद हो जाती है!",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/42/Photosynthetic_Bubbler_-_Jagadish_Chandra_Bose_Museum_-_Bose_Institute_-_Kolkata_2011-08-10_4741.JPG/960px-Photosynthetic_Bubbler_-_Jagadish_Chandra_Bose_Museum_-_Bose_Institute_-_Kolkata_2011-08-10_4741.JPG", fit: "contain",
          credit: "Biswarup Ganguly", license: "CC BY 3.0", page: "https://commons.wikimedia.org/wiki/File:Photosynthetic_Bubbler_-_Jagadish_Chandra_Bose_Museum_-_Bose_Institute_-_Kolkata_2011-08-10_4741.JPG" },
        headline: { en: "Bonus: *oxygen*!", hi: "बोनस: *ऑक्सीजन*!" },
        say: {
          en: "Oxygen bubbles out as a bonus. Indian scientist J. C. Bose even built this machine to count those bubbles!",
          hi: "साथ में ऑक्सीजन बाहर निकलती है। भारतीय वैज्ञानिक जगदीश चंद्र बोस ने तो इन बुलबुलों को गिनने की यह मशीन तक बनाई!",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/89/Farmer_manually_harvesting_rice_in_Raichur%2C_Karnataka.jpg/1280px-Farmer_manually_harvesting_rice_in_Raichur%2C_Karnataka.jpg", fit: "cover",
          credit: "Nanditha Gogate, WELL Labs", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Farmer_manually_harvesting_rice_in_Raichur,_Karnataka.jpg" },
        headline: { en: "Every meal *starts here*", hi: "हर निवाला *यहीं से*" },
        say: {
          en: "So every roti, every fruit, every grain of rice on your plate began as sunlight caught by a leaf.",
          hi: "यानी आपकी थाली की हर रोटी, हर फल, चावल का हर दाना — एक पत्ती की पकड़ी हुई धूप से शुरू हुआ।",
        },
      },
    ],
  },
  {
    id: "heart", subject: "Biology", emoji: "❤️", accent: "saffron", topic: "Human heart and blood circulation",
    title: { en: "Your heart never rests", hi: "दिल कभी आराम नहीं करता" },
    scenes: [
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a0/Heart_anterior_exterior_view.jpg/1280px-Heart_anterior_exterior_view.jpg", fit: "contain",
          credit: "Patrick J. Lynch, medical illustrator", license: "CC BY 2.5", page: "https://commons.wikimedia.org/wiki/File:Heart_anterior_exterior_view.jpg" },
        headline: { en: "A *fist-sized* pump", hi: "मुट्ठी जितना *पंप*" },
        say: {
          en: "Make a fist. That is about the size of your heart, and it never stops working.",
          hi: "अपनी मुट्ठी बंद कीजिए। आपका दिल लगभग इतना ही बड़ा है — और यह कभी रुकता नहीं।",
        },
      },
      {
        image: { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Heart_diagram_with_arrows.jpg/960px-Heart_diagram_with_arrows.jpg", fit: "contain",
          credit: "Rachel Sanchez Thwing", license: "CC BY 4.0", page: "https://commons.wikimedia.org/wiki/File:Heart_diagram_with_arrows.jpg" },
        headline: { en: "*4* rooms inside", hi: "अंदर *4* कमरे" },
        say: {
          en: "It has four chambers. Two atria on top receive blood, and two ventricles below pump it out.",
          hi: "इसमें चार कक्ष हैं। ऊपर के दो एट्रिया ख़ून लेते हैं, और नीचे के दो वेंट्रिकल उसे बाहर पंप करते हैं।",
        },
      },
      {
        image: { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Human_Lungs_%28NIH_BioArt_231_-_630892%29.png/960px-Human_Lungs_%28NIH_BioArt_231_-_630892%29.png", fit: "contain",
          credit: "Courtesy of NIAID Ryan Kissinger", license: "Public domain", page: "https://commons.wikimedia.org/wiki/File:Human_Lungs_(NIH_BioArt_231_-_630892).png" },
        headline: { en: "Blood's *round trip*", hi: "ख़ून का *चक्कर*" },
        motion: { kind: "flow", items: [{ emoji: "🫀", label: { en: "Right side", hi: "दायाँ हिस्सा" } }, { emoji: "🫁", label: { en: "Lungs", hi: "फेफड़े" } }, { emoji: "❤️", label: { en: "Left side", hi: "बायाँ हिस्सा" } }, { emoji: "🧍", label: { en: "Whole body", hi: "पूरा शरीर" } }] },
        say: {
          en: "Follow the blood. The right side pumps it to the lungs to pick up oxygen. It comes back to the left side, which pumps it to the whole body, and round again!",
          hi: "ख़ून का रास्ता देखिए। दायाँ हिस्सा उसे फेफड़ों में भेजता है, ऑक्सीजन लेने के लिए। फिर वह बाएँ हिस्से में लौटता है, जो उसे पूरे शरीर में पंप करता है — और फिर वही चक्कर!",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cb/Human_Heart_and_Circulatory_System.png/1280px-Human_Heart_and_Circulatory_System.png", fit: "contain",
          credit: "Bryan Brandenburg", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Human_Heart_and_Circulatory_System.png" },
        headline: { en: "Left side is the *strongest*", hi: "बायाँ हिस्सा सबसे *ताक़तवर*" },
        say: {
          en: "The left side has the thickest muscle, because it must push blood all the way to your toes.",
          hi: "बाएँ हिस्से की मांसपेशी सबसे मोटी होती है, क्योंकि उसे ख़ून पैरों की उँगलियों तक धकेलना होता है।",
        },
      },
      {
        image: { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/PMC4608198_Shashank_2015_Long_QT2_with_T-wave_alternans.jpg/960px-PMC4608198_Shashank_2015_Long_QT2_with_T-wave_alternans.jpg", fit: "contain",
          credit: "Shashank P Behere", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:PMC4608198_Shashank_2015_Long_QT2_with_T-wave_alternans.jpg" },
        headline: { en: "Beats *every day*", hi: "धड़कनें *हर दिन*" },
        stat: { en: "1,00,000", hi: "1,00,000" },
        say: {
          en: "Your heart beats about one lakh times every single day.",
          hi: "आपका दिल हर दिन लगभग एक लाख बार धड़कता है।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b5/Boy_Plays_Cricket_on_the_Seashore_-_Mahim_%28West%29_District_-_Mumbai_-_Maharashtra_%2825768860823%29.jpg/960px-Boy_Plays_Cricket_on_the_Seashore_-_Mahim_%28West%29_District_-_Mumbai_-_Maharashtra_%2825768860823%29.jpg", fit: "cover",
          credit: "Adam Jones from Kelowna, BC, Canada", license: "CC BY-SA 2.0", page: "https://commons.wikimedia.org/wiki/File:Boy_Plays_Cricket_on_the_Seashore_-_Mahim_(West)_District_-_Mumbai_-_Maharashtra_(25768860823).jpg" },
        headline: { en: "Keep it *strong*", hi: "इसे *मज़बूत* रखो" },
        say: {
          en: "Running, playing and eating healthy food keep this amazing pump strong for life.",
          hi: "दौड़ना, खेलना और अच्छा खाना — यही इस कमाल के पंप को उम्र भर मज़बूत रखते हैं।",
        },
      },
    ],
  },
  {
    id: "dna", subject: "Biology", emoji: "🧬", accent: "indigo", topic: "DNA and genes",
    title: { en: "The recipe book inside you", hi: "आपके अंदर की रेसिपी बुक" },
    scenes: [
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/80/DNA_methylation.jpg/1280px-DNA_methylation.jpg", fit: "cover",
          credit: "Christoph Bock, Max Planck Institute for Informa", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:DNA_methylation.jpg" },
        headline: { en: "Meet *DNA*", hi: "ये है *DNA*" },
        say: {
          en: "Every cell in your body carries a secret recipe book. It is called DNA.",
          hi: "आपके शरीर की हर कोशिका में एक गुप्त रेसिपी बुक होती है। इसे DNA कहते हैं।",
        },
      },
      {
        image: { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Multicolor_fluorescence_image_of_living_HeLa_cells.jpg/960px-Multicolor_fluorescence_image_of_living_HeLa_cells.jpg", fit: "cover",
          credit: "8x57is", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Multicolor_fluorescence_image_of_living_HeLa_cells.jpg" },
        headline: { en: "Zoom into *you*", hi: "*आपके* अंदर ज़ूम" },
        motion: { kind: "zoom", items: [{ emoji: "🧍", label: { en: "You", hi: "आप" } }, { emoji: "🦠", label: { en: "Cell", hi: "कोशिका" } }, { emoji: "🔵", label: { en: "Nucleus", hi: "केंद्रक" } }, { emoji: "🧬", label: { en: "DNA", hi: "DNA" } }] },
        say: {
          en: "Zoom in. Your body is made of trillions of cells. Inside each cell is a nucleus. And inside the nucleus, DNA!",
          hi: "ज़ूम कीजिए। आपका शरीर खरबों कोशिकाओं से बना है। हर कोशिका के अंदर एक केंद्रक है। और केंद्रक के अंदर — DNA!",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/05/DNA_base-pair_diagram.jpg/1280px-DNA_base-pair_diagram.jpg", fit: "contain",
          credit: "Darryl Leja for the National Human Genome Resear", license: "Public domain", page: "https://commons.wikimedia.org/wiki/File:DNA_base-pair_diagram.jpg" },
        headline: { en: "Just *4* letters", hi: "बस *4* अक्षर" },
        say: {
          en: "DNA is a twisted ladder. Its steps use just four letters: A, T, G and C.",
          hi: "DNA एक मुड़ी हुई सीढ़ी जैसा है। इसकी सीढ़ियाँ बस चार अक्षरों से बनी हैं: A, T, G और C।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d0/Human_karyotype_%28263_19%29_Karyotype_Human_45%2CXY_t1-17_%28mosaic%29.jpg/1280px-Human_karyotype_%28263_19%29_Karyotype_Human_45%2CXY_t1-17_%28mosaic%29.jpg", fit: "cover",
          credit: "Doc. RNDr. Josef Reischig, CSc.", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Human_karyotype_(263_19)_Karyotype_Human_45,XY_t1-17_(mosaic).jpg" },
        headline: { en: "Packed in *46 chromosomes*", hi: "*46 गुणसूत्रों* में पैक" },
        stat: { en: "2 m", hi: "2 मीटर" },
        say: {
          en: "Stretched out, the DNA in one cell would be about two metres long. It is packed into 46 chromosomes.",
          hi: "एक कोशिका का DNA खींचकर सीधा करें तो लगभग दो मीटर लंबा होगा। यह 46 गुणसूत्रों में पैक रहता है।",
        },
      },
      {
        image: { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/DNA_Visual_Representation_of_Double-Helix.png/960px-DNA_Visual_Representation_of_Double-Helix.png", fit: "contain",
          credit: "Unknown author", license: "Public domain", page: "https://commons.wikimedia.org/wiki/File:DNA_Visual_Representation_of_Double-Helix.png" },
        overlay: "half-half",
        headline: { en: "Half from *Maa*, half from *Papa*", hi: "आधा *माँ* से, आधा *पापा* से" },
        say: {
          en: "You got half of your DNA from your mother and half from your father. That is why you look like your family.",
          hi: "आपको आधा DNA माँ से मिला और आधा पिता से। इसीलिए आप अपने परिवार जैसे दिखते हैं।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f5/Gudi_Padwa_Festival_2050_14.jpg/1280px-Gudi_Padwa_Festival_2050_14.jpg", fit: "cover",
          credit: "AmanAgrahari01", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Gudi_Padwa_Festival_2050_14.jpg" },
        headline: { en: "*99.9%* the same", hi: "*99.9%* एक जैसे" },
        say: {
          en: "And the wow fact: every human on Earth shares about 99.9 percent of the same DNA.",
          hi: "और सबसे मज़ेदार बात: धरती के सारे इंसानों का लगभग 99.9 प्रतिशत DNA एक जैसा है।",
        },
      },
    ],
  },
  {
    id: "volcano", subject: "Geography", emoji: "🌋", accent: "saffron", topic: "Volcanoes",
    title: { en: "Why volcanoes erupt", hi: "ज्वालामुखी क्यों फटते हैं?" },
    scenes: [
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bb/K%C4%ABlauea_-_Volcano_eruption_%28night%29.jpg/960px-K%C4%ABlauea_-_Volcano_eruption_%28night%29.jpg", fit: "cover",
          credit: "Domino721", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:K%C4%ABlauea_-_Volcano_eruption_(night).jpg" },
        headline: { en: "Earth's *hot breath*", hi: "धरती की *गरम साँस*" },
        pan: "up",
        say: {
          en: "A volcano is an opening where the Earth lets out its hot, melted insides.",
          hi: "ज्वालामुखी धरती का वह मुँह है जहाँ से उसका गरम, पिघला हुआ अंदरूनी हिस्सा बाहर आता है।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/92/Earth-crust-cutaway-English-Large_label.PNG/1280px-Earth-crust-cutaway-English-Large_label.PNG", fit: "contain",
          credit: "Washiucho derivative work:", license: "Public domain", page: "https://commons.wikimedia.org/wiki/File:Earth-crust-cutaway-English-Large_label.PNG" },
        headline: { en: "Rock *melts*", hi: "चट्टान *पिघलती* है" },
        motion: { kind: "particles", items: [{ emoji: "🪨", label: { en: "Solid rock", hi: "ठोस चट्टान" } }, { emoji: "🔥", label: { en: "Magma", hi: "मैग्मा" } }, { emoji: "💨", label: { en: "Gas", hi: "गैस" } }] },
        say: {
          en: "Deep inside the Earth, the heat keeps rising. Solid rock melts into liquid magma, and gases bubble out of it.",
          hi: "धरती के अंदर गहराई में गर्मी बढ़ती जाती है। ठोस चट्टान पिघलकर तरल मैग्मा बनती है, और उसमें से गैसें बुलबुले बनकर निकलती हैं।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ae/Hawaiian_Eruption-numbers.svg/1280px-Hawaiian_Eruption-numbers.svg.png", fit: "contain",
          credit: "Sémhur", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Hawaiian_Eruption-numbers.svg" },
        headline: { en: "Pressure *builds up*", hi: "*दबाव* बढ़ता है" },
        say: {
          en: "Magma is lighter than solid rock, so it rises. Gas trapped inside it builds up huge pressure.",
          hi: "मैग्मा ठोस चट्टान से हल्का होता है, इसलिए ऊपर उठता है। उसमें फँसी गैस भारी दबाव बनाती है।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/89/P%C4%81hoehoe_and_Aa_flows_at_Hawaii.jpg/1280px-P%C4%81hoehoe_and_Aa_flows_at_Hawaii.jpg", fit: "cover",
          credit: "Brocken Inaglory", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:P%C4%81hoehoe_and_Aa_flows_at_Hawaii.jpg" },
        headline: { en: "Magma becomes *lava*", hi: "मैग्मा बना *लावा*" },
        stat: { en: "1000 °C+", hi: "1000 °C+" },
        say: {
          en: "When it bursts out, we call it lava. It can be hotter than one thousand degrees Celsius!",
          hi: "बाहर निकलते ही इसे लावा कहते हैं। यह एक हज़ार डिग्री सेल्सियस से भी ज़्यादा गरम हो सकता है!",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5d/Barren_Volcano%2C_Barren_Island%2C_Andaman_and_Nicobar_Islands%2C_India.jpg/1280px-Barren_Volcano%2C_Barren_Island%2C_Andaman_and_Nicobar_Islands%2C_India.jpg", fit: "cover",
          credit: "SentinelHub", license: "CC BY 2.0", page: "https://commons.wikimedia.org/wiki/File:Barren_Volcano,_Barren_Island,_Andaman_and_Nicobar_Islands,_India.jpg" },
        headline: { en: "India has *one* too!", hi: "भारत में भी *एक* है!" },
        say: {
          en: "India's only active volcano is Barren Island, in the Andaman Sea.",
          hi: "भारत का इकलौता सक्रिय ज्वालामुखी है बैरन द्वीप — अंडमान सागर में।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/02/Volcanic_Soil.jpg/1280px-Volcanic_Soil.jpg", fit: "cover",
          credit: "Miguel Virkkunen Carvalho from Lahti, Finland", license: "CC BY 2.0", page: "https://commons.wikimedia.org/wiki/File:Volcanic_Soil.jpg" },
        headline: { en: "Fire that *feeds*", hi: "आग जो *अन्न* दे" },
        say: {
          en: "Over time, volcanic ash turns into some of the most fertile soil on Earth.",
          hi: "समय के साथ ज्वालामुखी की राख धरती की सबसे उपजाऊ मिट्टी में बदल जाती है।",
        },
      },
    ],
  },
  {
    id: "monsoon", subject: "Geography", emoji: "🌧️", accent: "teal", topic: "Indian monsoon",
    title: { en: "How the monsoon reaches India", hi: "मानसून भारत कैसे आता है?" },
    scenes: [
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1d/Monsoon_Clouds_over_Madhurawada_08.JPG/1280px-Monsoon_Clouds_over_Madhurawada_08.JPG", fit: "cover",
          credit: "Adityamadhav83", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Monsoon_Clouds_over_Madhurawada_08.JPG" },
        headline: { en: "Here comes the *monsoon*", hi: "आ गया *मानसून*" },
        say: {
          en: "Every June, dark clouds roll over India, and the monsoon begins.",
          hi: "हर साल जून में भारत पर काले बादल छा जाते हैं — और मानसून शुरू हो जाता है।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e1/Drought.jpg/960px-Drought.jpg", fit: "cover",
          credit: "Tomas Castelazo", license: "CC BY 3.0", page: "https://commons.wikimedia.org/wiki/File:Drought.jpg" },
        headline: { en: "Land *heats up*", hi: "ज़मीन *तपती* है" },
        say: {
          en: "In summer, the land heats up much faster than the sea.",
          hi: "गर्मियों में ज़मीन समुद्र से कहीं ज़्यादा तेज़ी से गरम होती है।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a4/Indian_Ocean_space_view.png/1280px-Indian_Ocean_space_view.png", fit: "contain",
          credit: "Przemek Pietrak", license: "CC BY 3.0", page: "https://commons.wikimedia.org/wiki/File:Indian_Ocean_space_view.png" },
        overlay: "winds",
        headline: { en: "Sea winds *rush in*", hi: "समुद्री हवा *दौड़ती* है" },
        say: {
          en: "Hot air over the land rises, and moist wind from the Indian Ocean rushes in to take its place.",
          hi: "ज़मीन के ऊपर की गरम हवा ऊपर उठती है, और हिंद महासागर की नम हवा उसकी जगह लेने दौड़ पड़ती है।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/ff/Western_Ghats_Rajapalayam_Aug24_A7CR_02067.jpg/1280px-Western_Ghats_Rajapalayam_Aug24_A7CR_02067.jpg", fit: "cover",
          credit: "Timothy A. Gonsalves. Feel free to u", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Western_Ghats_Rajapalayam_Aug24_A7CR_02067.jpg" },
        headline: { en: "Mountains *squeeze* the rain", hi: "पहाड़ *निचोड़ते* हैं बादल" },
        motion: { kind: "cycle", items: [{ emoji: "🌊", label: { en: "Warm sea", hi: "गरम समुद्र" } }, { emoji: "☁️", label: { en: "Clouds", hi: "बादल" } }, { emoji: "⛰️", label: { en: "Mountains", hi: "पहाड़" } }, { emoji: "🌧️", label: { en: "Rain", hi: "बारिश" } }] },
        say: {
          en: "Water rises from the warm sea and forms clouds. Winds push them against the Western Ghats and the Himalayas. They cool down and pour as rain, and rivers carry it back to the sea.",
          hi: "गरम समुद्र से पानी उठकर बादल बनता है। हवाएँ उन्हें पश्चिमी घाट और हिमालय की ओर धकेलती हैं। वहाँ वे ठंडे होकर बरसते हैं, और नदियाँ पानी वापस समुद्र तक ले जाती हैं।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d8/Lyngksiar%2C_Sohra%2C_India.jpg/1280px-Lyngksiar%2C_Sohra%2C_India.jpg", fit: "cover",
          credit: "Chirag1745", license: "CC0", page: "https://commons.wikimedia.org/wiki/File:Lyngksiar,_Sohra,_India.jpg" },
        headline: { en: "Among the *wettest* places", hi: "सबसे *गीली* जगहों में" },
        say: {
          en: "Cherrapunji and Mawsynram in Meghalaya are among the rainiest places on Earth.",
          hi: "मेघालय के चेरापूंजी और मॉसिनराम धरती की सबसे ज़्यादा बारिश वाली जगहों में हैं।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/75/Paddy_field_in_Kerala.jpg/1280px-Paddy_field_in_Kerala.jpg", fit: "cover",
          credit: "Shagil Kannur", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Paddy_field_in_Kerala.jpg" },
        headline: { en: "It *feeds* the nation", hi: "देश का *पेट* भरता है" },
        say: {
          en: "About half of India's farmland depends on these rains. The monsoon truly feeds the nation.",
          hi: "भारत की लगभग आधी खेती इसी बारिश पर टिकी है। मानसून सच में पूरे देश का पेट भरता है।",
        },
      },
    ],
  },
  {
    id: "lightning", subject: "Physics", emoji: "⚡", accent: "indigo", topic: "Lightning and static electricity",
    title: { en: "What is lightning?", hi: "आसमानी बिजली क्या है?" },
    scenes: [
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/ba/Storm_over_the_Brisbane_city_centre.jpg/1280px-Storm_over_the_Brisbane_city_centre.jpg", fit: "cover",
          credit: "Alan Shaw", license: "CC BY-SA 2.0", page: "https://commons.wikimedia.org/wiki/File:Storm_over_the_Brisbane_city_centre.jpg" },
        headline: { en: "A *giant* spark", hi: "एक *विशाल* चिंगारी" },
        say: {
          en: "Lightning is a giant electric spark, like the tiny shock from a woollen sweater, but billions of times bigger.",
          hi: "आसमानी बिजली एक विशाल इलेक्ट्रिक चिंगारी है — ऊनी स्वेटर के छोटे झटके जैसी, बस अरबों गुना बड़ी।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fd/Chmura_burzowa_na_wsch%C3%B3d_od_Krakowa%2C_20230829_1826_0339.jpg/1280px-Chmura_burzowa_na_wsch%C3%B3d_od_Krakowa%2C_20230829_1826_0339.jpg", fit: "cover",
          credit: "Jakub Hałun", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Chmura_burzowa_na_wsch%C3%B3d_od_Krakowa,_20230829_1826_0339.jpg" },
        headline: { en: "Clouds get *charged*", hi: "बादलों में *चार्ज*" },
        say: {
          en: "Inside storm clouds, ice crystals and tiny hailstones crash into each other and build up electric charge.",
          hi: "तूफ़ानी बादलों के अंदर बर्फ़ के कण और छोटे ओले आपस में टकराते हैं और बिजली का चार्ज जमा होता है।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7c/Chmura_burzowa_na_wsch%C3%B3d_od_Krakowa%2C_20250904_1851_4432.jpg/1280px-Chmura_burzowa_na_wsch%C3%B3d_od_Krakowa%2C_20250904_1851_4432.jpg", fit: "cover",
          credit: "Jakub Hałun", license: "CC BY 4.0", page: "https://commons.wikimedia.org/wiki/File:Chmura_burzowa_na_wsch%C3%B3d_od_Krakowa,_20250904_1851_4432.jpg" },
        overlay: "charges",
        headline: { en: "*+* on top, *−* below", hi: "ऊपर *+*, नीचे *−*" },
        say: {
          en: "Positive charge gathers at the top of the cloud, and negative charge at the bottom.",
          hi: "बादल के ऊपर पॉज़िटिव चार्ज इकट्ठा होता है, और नीचे नेगेटिव चार्ज।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bd/Cloud_to_ground_lightning_bangalore.jpg/960px-Cloud_to_ground_lightning_bangalore.jpg", fit: "cover",
          credit: "Ezhuttukari", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Cloud_to_ground_lightning_bangalore.jpg" },
        headline: { en: "*Hotter* than the Sun", hi: "सूरज से भी *गरम*" },
        stat: { en: "30,000 °C", hi: "30,000 °C" },
        say: {
          en: "When the charge gets too big, it jumps to the ground and heats the air to about thirty thousand degrees. That is hotter than the Sun's surface!",
          hi: "जब चार्ज बहुत बढ़ जाता है, तो वह ज़मीन पर कूद पड़ता है और हवा को लगभग तीस हज़ार डिग्री तक गरम कर देता है — सूरज की सतह से भी ज़्यादा!",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c2/Port_and_lighthouse_overnight_storm_with_lightning_in_Port-la-Nouvelle.jpg/1280px-Port_and_lighthouse_overnight_storm_with_lightning_in_Port-la-Nouvelle.jpg", fit: "cover",
          credit: "Maxime Raynal from France", license: "CC BY 2.0", page: "https://commons.wikimedia.org/wiki/File:Port_and_lighthouse_overnight_storm_with_lightning_in_Port-la-Nouvelle.jpg" },
        headline: { en: "Flash first, *boom* later", hi: "पहले *चमक*, फिर गड़गड़ाहट" },
        say: {
          en: "Light travels much faster than sound. So you see the flash first and hear the thunder later.",
          hi: "रोशनी आवाज़ से बहुत तेज़ चलती है। इसलिए पहले चमक दिखती है और गड़गड़ाहट बाद में सुनाई देती है।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c0/Karcag_1_post_office%2C_lightning_rod%2C_2018_Karcag.jpg/960px-Karcag_1_post_office%2C_lightning_rod%2C_2018_Karcag.jpg", fit: "cover",
          credit: "Globetrotter19", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Karcag_1_post_office,_lightning_rod,_2018_Karcag.jpg" },
        headline: { en: "Stay *safe*", hi: "*सुरक्षित* रहें" },
        say: {
          en: "Lightning rods guide the charge safely into the ground. In a storm, stay indoors and away from tall trees.",
          hi: "तड़ित चालक बिजली को सुरक्षित ज़मीन में पहुँचा देते हैं। तूफ़ान में घर के अंदर रहें और ऊँचे पेड़ों से दूर रहें।",
        },
      },
    ],
  },
  {
    id: "rainbow", subject: "Physics", emoji: "🌈", accent: "saffron", topic: "Dispersion of light and rainbows",
    title: { en: "The secret of the rainbow", hi: "इंद्रधनुष का राज़" },
    scenes: [
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8e/Landscape_with_rainbow_and_the_Old_Bridge_over_the_Nam_Khan_river_in_Luang_Prabang_Laos.jpg/1280px-Landscape_with_rainbow_and_the_Old_Bridge_over_the_Nam_Khan_river_in_Luang_Prabang_Laos.jpg", fit: "cover",
          credit: "Basile Morin", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Landscape_with_rainbow_and_the_Old_Bridge_over_the_Nam_Khan_river_in_Luang_Prabang_Laos.jpg" },
        headline: { en: "White light's *secret*", hi: "सफ़ेद धूप का *राज़*" },
        say: {
          en: "White sunlight hides a secret. It is actually a mix of many colours.",
          hi: "सफ़ेद धूप एक राज़ छिपाए हुए है। असल में वह कई रंगों का मेल है।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/75/Prisms.jpg/1280px-Prisms.jpg", fit: "cover",
          credit: "Sobolishko", license: "CC BY 4.0", page: "https://commons.wikimedia.org/wiki/File:Prisms.jpg" },
        headline: { en: "A prism *splits* it", hi: "प्रिज़्म इसे *बिखेरता* है" },
        motion: { kind: "split", items: [{ emoji: "☀️", label: { en: "White light", hi: "सफ़ेद धूप" } }, { emoji: "🟣", label: { en: "Violet", hi: "बैंगनी" } }, { emoji: "🔵", label: { en: "Blue", hi: "नीला" } }, { emoji: "🟢", label: { en: "Green", hi: "हरा" } }, { emoji: "🟡", label: { en: "Yellow", hi: "पीला" } }, { emoji: "🟠", label: { en: "Orange", hi: "नारंगी" } }, { emoji: "🔴", label: { en: "Red", hi: "लाल" } }] },
        say: {
          en: "Send white sunlight into a glass prism. It bends, and splits into a fan of seven colours!",
          hi: "सफ़ेद धूप को काँच के प्रिज़्म में भेजिए। वह मुड़ती है, और सात रंगों के पंखे में बिखर जाती है!",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7f/Light_spectrum_on_a_wall_caused_by_sunlight_going_through_prism_and_then_through_handmade_glass.jpg/960px-Light_spectrum_on_a_wall_caused_by_sunlight_going_through_prism_and_then_through_handmade_glass.jpg", fit: "cover",
          credit: "Pittigrilli", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Light_spectrum_on_a_wall_caused_by_sunlight_going_through_prism_and_then_through_handmade_glass.jpg" },
        overlay: "vibgyor",
        headline: { en: "*VIBGYOR*", hi: "*VIBGYOR*" },
        say: {
          en: "Violet, indigo, blue, green, yellow, orange and red. Remember them as VIBGYOR.",
          hi: "बैंगनी, जामुनी, नीला, हरा, पीला, नारंगी और लाल — इन्हें याद रखिए VIBGYOR से।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5e/Water_drop_001.jpg/1280px-Water_drop_001.jpg", fit: "cover",
          credit: "José Manuel Suárez from Spain", license: "CC BY 2.0", page: "https://commons.wikimedia.org/wiki/File:Water_drop_001.jpg" },
        headline: { en: "Raindrops = tiny *prisms*", hi: "बूँदें = छोटे *प्रिज़्म*" },
        say: {
          en: "After rain, millions of water drops floating in the air act like tiny prisms.",
          hi: "बारिश के बाद हवा में तैरती लाखों बूँदें छोटे-छोटे प्रिज़्म की तरह काम करती हैं।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/27/WhereRainbowRises.jpg/960px-WhereRainbowRises.jpg", fit: "cover",
          credit: "Wing-Chi Poon", license: "CC BY-SA 2.5", page: "https://commons.wikimedia.org/wiki/File:WhereRainbowRises.jpg" },
        headline: { en: "Sun *behind* you", hi: "सूरज *पीछे*, बारिश सामने" },
        pan: "up",
        say: {
          en: "That is why you see a rainbow only when the Sun is behind you and the rain is in front of you.",
          hi: "इसीलिए इंद्रधनुष तभी दिखता है जब सूरज आपकी पीठ की ओर हो और बारिश सामने।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/49/Steam_Phase_eruption_of_Castle_geyser_with_double_rainbow.jpg/1280px-Steam_Phase_eruption_of_Castle_geyser_with_double_rainbow.jpg", fit: "cover",
          credit: "Brocken Inaglory", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Steam_Phase_eruption_of_Castle_geyser_with_double_rainbow.jpg" },
        headline: { en: "*Double* rainbow!", hi: "*दोहरा* इंद्रधनुष!" },
        say: {
          en: "Sometimes light bounces twice inside the drops, and you get a double rainbow with its colours flipped!",
          hi: "कभी-कभी रोशनी बूँदों के अंदर दो बार टकराकर लौटती है — और दोहरा इंद्रधनुष बनता है, जिसके रंग उल्टे होते हैं!",
        },
      },
    ],
  },
  {
    id: "moon-phases", subject: "Space", emoji: "🌙", accent: "indigo", topic: "Phases of the Moon",
    title: { en: "Why the Moon changes shape", hi: "चाँद का आकार क्यों बदलता है?" },
    scenes: [
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/72/Near_Full_Moon_in_High_Resolution.jpg/1280px-Near_Full_Moon_in_High_Resolution.jpg", fit: "contain",
          credit: "Msadler13", license: "CC BY 4.0", page: "https://commons.wikimedia.org/wiki/File:Near_Full_Moon_in_High_Resolution.jpg" },
        headline: { en: "No light of its *own*", hi: "अपनी *रोशनी* नहीं" },
        say: {
          en: "The Moon has no light of its own. It shines because sunlight bounces off it.",
          hi: "चाँद की अपनी कोई रोशनी नहीं होती। वह इसलिए चमकता है क्योंकि सूरज की रोशनी उससे टकराकर लौटती है।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f6/Lunar_phases_al-Biruni.jpg/1280px-Lunar_phases_al-Biruni.jpg", fit: "contain",
          credit: "Al-Biruni", license: "Public domain", page: "https://commons.wikimedia.org/wiki/File:Lunar_phases_al-Biruni.jpg" },
        headline: { en: "Half is *always* lit", hi: "आधा हिस्सा *हमेशा* रोशन" },
        say: {
          en: "The Sun always lights up half of the Moon. The scholar Al-Biruni drew this idea about a thousand years ago.",
          hi: "सूरज हमेशा चाँद के आधे हिस्से को रोशन करता है। विद्वान अल-बिरूनी ने यह चित्र लगभग हज़ार साल पहले बनाया था।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/76/Waxing_Crescent_Moon_in_Kurseong_September_2026_by_Paramanu_Sarkar.jpg/1280px-Waxing_Crescent_Moon_in_Kurseong_September_2026_by_Paramanu_Sarkar.jpg", fit: "cover",
          credit: "Paramanu Sarkar", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Waxing_Crescent_Moon_in_Kurseong_September_2026_by_Paramanu_Sarkar.jpg" },
        headline: { en: "Round and *round*", hi: "गोल-गोल *चक्कर*" },
        motion: { kind: "orbit", items: [{ emoji: "🌍", label: { en: "Earth", hi: "धरती" } }, { emoji: "🌙", label: { en: "Moon", hi: "चाँद" } }, { emoji: "", label: { en: "Earth's pull", hi: "धरती का खिंचाव" } }] },
        say: {
          en: "The Moon travels around the Earth about once a month. Earth's gravity keeps pulling it, so it never flies away. As it moves, we see more or less of its lit half.",
          hi: "चाँद लगभग महीने भर में धरती का एक चक्कर लगाता है। धरती का गुरुत्वाकर्षण उसे खींचे रखता है, इसलिए वह दूर नहीं भागता। घूमते हुए हमें उसका रोशन हिस्सा कम-ज़्यादा दिखता है।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/32/First_Quarter_Moon_in_Kurseong_September_2026_by_Paramanu_Sarkar.jpg/1280px-First_Quarter_Moon_in_Kurseong_September_2026_by_Paramanu_Sarkar.jpg", fit: "cover",
          credit: "Paramanu Sarkar", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:First_Quarter_Moon_in_Kurseong_September_2026_by_Paramanu_Sarkar.jpg" },
        headline: { en: "Growing: *Shukla Paksha*", hi: "बढ़ता चाँद: *शुक्ल पक्ष*" },
        say: {
          en: "A week later we see half of it. The bright part keeps growing. This is called waxing, or Shukla Paksha.",
          hi: "एक हफ़्ते बाद आधा चाँद दिखता है। रोशन हिस्सा बढ़ता जाता है — इसे शुक्ल पक्ष कहते हैं।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2d/A_full_moon_rises_%28potw2402a%29.jpg/1280px-A_full_moon_rises_%28potw2402a%29.jpg", fit: "cover",
          credit: "P. Horálek/ESO", license: "CC BY 4.0", page: "https://commons.wikimedia.org/wiki/File:A_full_moon_rises_(potw2402a).jpg" },
        headline: { en: "*Purnima!*", hi: "*पूर्णिमा!*" },
        say: {
          en: "On Purnima we see the whole lit side. Then it shrinks again, all the way to Amavasya.",
          hi: "पूर्णिमा को हमें पूरा रोशन हिस्सा दिखता है। फिर वह घटते-घटते अमावस्या तक पहुँच जाता है।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fe/Apollo_12_-_Al%27s_Triple_Craters_Pan_-_Alternate.jpg/1280px-Apollo_12_-_Al%27s_Triple_Craters_Pan_-_Alternate.jpg", fit: "cover",
          credit: "NASA/Al Bean/Kev Holmes (Panorama assembly)", license: "Public domain", page: "https://commons.wikimedia.org/wiki/File:Apollo_12_-_Al%27s_Triple_Craters_Pan_-_Alternate.jpg" },
        headline: { en: "Days in *one cycle*", hi: "*एक चक्र* के दिन" },
        stat: { en: "29.5", hi: "29.5" },
        say: {
          en: "One full cycle takes about twenty nine and a half days. That is where the idea of a month comes from!",
          hi: "एक पूरा चक्र लगभग साढ़े उनतीस दिन का होता है। महीने का विचार यहीं से आया!",
        },
      },
    ],
  },
  {
    id: "black-hole", subject: "Space", emoji: "🕳️", accent: "indigo", topic: "Black holes",
    title: { en: "What is a black hole?", hi: "ब्लैक होल क्या है?" },
    scenes: [
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cf/Black_hole_-_Messier_87.jpg/1280px-Black_hole_-_Messier_87.jpg", fit: "cover",
          credit: "Event Horizon Telescope", license: "CC BY 4.0", page: "https://commons.wikimedia.org/wiki/File:Black_hole_-_Messier_87.jpg" },
        headline: { en: "A *real* photo!", hi: "एक *असली* तस्वीर!" },
        say: {
          en: "This is a real picture of a black hole, taken in 2019 by telescopes all around the world.",
          hi: "यह एक ब्लैक होल की असली तस्वीर है, जिसे 2019 में दुनिया भर की दूरबीनों ने मिलकर खींचा।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/00/Crab_Nebula.jpg/1280px-Crab_Nebula.jpg", fit: "cover",
          credit: "NASA, ESA, J. Hester and A. Loll (Arizona State", license: "Public domain", page: "https://commons.wikimedia.org/wiki/File:Crab_Nebula.jpg" },
        headline: { en: "A giant star *collapses*", hi: "विशाल तारा *ढह* जाता है" },
        say: {
          en: "When a giant star runs out of fuel, it explodes, and its core can collapse under its own gravity.",
          hi: "जब कोई विशाल तारा अपना ईंधन ख़त्म कर लेता है, तो वह फट जाता है, और उसका केंद्र अपने ही गुरुत्वाकर्षण से ढह सकता है।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/97/The_Earth_seen_from_Apollo_17.jpg/960px-The_Earth_seen_from_Apollo_17.jpg", fit: "contain",
          credit: "NASA/Apollo 17 crew; taken by either Harrison Sc", license: "Public domain", page: "https://commons.wikimedia.org/wiki/File:The_Earth_seen_from_Apollo_17.jpg" },
        headline: { en: "Earth, as small as a *marble*", hi: "धरती, एक *कंचे* जितनी" },
        say: {
          en: "If you squeezed the whole Earth to the size of a marble, it would become a black hole.",
          hi: "अगर पूरी धरती को दबाकर एक कंचे जितना छोटा कर दें, तो वह ब्लैक होल बन जाएगी।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8f/Artist%27s_impression_of_a_black_hole_and_accretion_disk_%28Black-Hole-5K%29.jpg/1280px-Artist%27s_impression_of_a_black_hole_and_accretion_disk_%28Black-Hole-5K%29.jpg", fit: "cover",
          credit: "NOIRLab/AURA/NSF/P. Marenfeld", license: "CC BY 4.0", page: "https://commons.wikimedia.org/wiki/File:Artist%27s_impression_of_a_black_hole_and_accretion_disk_(Black-Hole-5K).jpg" },
        headline: { en: "Not even *light* escapes", hi: "*रोशनी* भी नहीं बचती" },
        say: {
          en: "Its gravity is so strong that not even light can escape. That is why it looks black.",
          hi: "इसका गुरुत्वाकर्षण इतना तेज़ है कि रोशनी भी बाहर नहीं निकल पाती। इसीलिए यह काला दिखता है।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/15/Sag_A%2A.jpg/1280px-Sag_A%2A.jpg", fit: "contain",
          credit: "EHT Collaboration", license: "CC BY 4.0", page: "https://commons.wikimedia.org/wiki/File:Sag_A*.jpg" },
        headline: { en: "At our *galaxy's heart*", hi: "हमारी *आकाशगंगा* के बीच" },
        motion: { kind: "orbit", items: [{ emoji: "🕳️", label: { en: "Sagittarius A*", hi: "सैजिटेरियस A*" } }, { emoji: "⭐", label: { en: "Star", hi: "तारा" } }, { emoji: "", label: { en: "Gravity", hi: "गुरुत्वाकर्षण" } }, { emoji: "", label: { en: "Super fast", hi: "बहुत तेज़" } }] },
        say: {
          en: "At the centre of our own galaxy sits a giant black hole, Sagittarius A star. Stars race around it, held by its enormous gravity.",
          hi: "हमारी अपनी आकाशगंगा के बीच में एक विशाल ब्लैक होल है — सैजिटेरियस ए स्टार। तारे इसके चारों ओर तेज़ी से घूमते हैं, इसके ज़बरदस्त गुरुत्वाकर्षण में बँधे हुए।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a2/Milky_Way_over_Cronan_Ranch_%2852321033535%29.jpg/1280px-Milky_Way_over_Cronan_Ranch_%2852321033535%29.jpg", fit: "cover",
          credit: "blmcalifornia", license: "Public domain", page: "https://commons.wikimedia.org/wiki/File:Milky_Way_over_Cronan_Ranch_(52321033535).jpg" },
        headline: { en: "Don't *worry*!", hi: "*घबराइए* मत!" },
        stat: { en: "26,000 light years", hi: "26,000 प्रकाश-वर्ष" },
        say: {
          en: "Don't worry. It is about twenty six thousand light years away. We are perfectly safe!",
          hi: "घबराइए मत। वह हमसे लगभग छब्बीस हज़ार प्रकाश-वर्ष दूर है। हम पूरी तरह सुरक्षित हैं!",
        },
      },
    ],
  },
  {
    id: "sun", subject: "Space", emoji: "☀️", accent: "saffron", topic: "The Sun",
    title: { en: "How big is the Sun?", hi: "सूरज कितना बड़ा है?" },
    scenes: [
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b4/The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg/1280px-The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg", fit: "contain",
          credit: "NASA/SDO (AIA)", license: "Public domain", page: "https://commons.wikimedia.org/wiki/File:The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg" },
        headline: { en: "Our *nearest* star", hi: "हमारा *सबसे पास* का तारा" },
        say: {
          en: "The Sun is a star. It is simply the star closest to us.",
          hi: "सूरज एक तारा है — बस हमारे सबसे पास वाला तारा।",
        },
      },
      {
        image: { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Planets_and_sun_size_comparison_%28cropped%29.jpg/960px-Planets_and_sun_size_comparison_%28cropped%29.jpg", fit: "contain",
          credit: "Lsmpascal", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Planets_and_sun_size_comparison_(cropped).jpg" },
        headline: { en: "*13 lakh* Earths inside", hi: "अंदर *13 लाख* धरतियाँ" },
        say: {
          en: "It is so big that about thirteen lakh Earths could fit inside it.",
          hi: "यह इतना बड़ा है कि इसके अंदर लगभग तेरह लाख धरतियाँ समा सकती हैं।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6c/February_16%2C_2024_X2_5_Solar_Flare_%28SVS14531_-_SDO_304_02162024_065541%29.png/1280px-February_16%2C_2024_X2_5_Solar_Flare_%28SVS14531_-_SDO_304_02162024_065541%29.png", fit: "contain",
          credit: "NASA's Scientific Visualization Studio - A. J. C", license: "Public domain", page: "https://commons.wikimedia.org/wiki/File:February_16,_2024_X2_5_Solar_Flare_(SVS14531_-_SDO_304_02162024_065541).png" },
        headline: { en: "A nuclear *furnace*", hi: "एक परमाणु *भट्टी*" },
        motion: { kind: "reaction", items: [{ emoji: "⚛️", label: { en: "Hydrogen", hi: "हाइड्रोजन" } }, { emoji: "⚛️", label: { en: "Hydrogen", hi: "हाइड्रोजन" } }, { emoji: "🎈", label: { en: "Helium", hi: "हीलियम" } }, { emoji: "✨", label: { en: "Energy", hi: "ऊर्जा" } }] },
        say: {
          en: "Deep in the core, hydrogen atoms smash together and fuse into helium. Each crash releases a burst of energy, as light and heat.",
          hi: "केंद्र में हाइड्रोजन के परमाणु आपस में टकराकर हीलियम बन जाते हैं। हर टक्कर से ढेर सारी ऊर्जा निकलती है — रोशनी और गर्मी बनकर।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/95/Sun_rising_over_a_blanket_of_clouds%2C_Nandi_Hills%2C_Karnataka_%28edit%29.jpg/1280px-Sun_rising_over_a_blanket_of_clouds%2C_Nandi_Hills%2C_Karnataka_%28edit%29.jpg", fit: "cover",
          credit: "Sri Chakra Pranav Derivative work: UnpetitproleX", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Sun_rising_over_a_blanket_of_clouds,_Nandi_Hills,_Karnataka_(edit).jpg" },
        headline: { en: "Light from the *past*", hi: "*पुरानी* रोशनी" },
        stat: { en: "8 min 20 s", hi: "8 मिनट 20 सेकंड" },
        say: {
          en: "Sunlight takes about eight minutes and twenty seconds to reach us. So you always see the Sun as it was eight minutes ago!",
          hi: "सूरज की रोशनी को हम तक पहुँचने में लगभग आठ मिनट बीस सेकंड लगते हैं। यानी आप हमेशा आठ मिनट पुराना सूरज देखते हैं!",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9e/Aditya_L1_sun_image7.png/1280px-Aditya_L1_sun_image7.png", fit: "contain",
          credit: "ISRO", license: "CC0", page: "https://commons.wikimedia.org/wiki/File:Aditya_L1_sun_image7.png" },
        headline: { en: "India's *Aditya-L1*", hi: "भारत का *आदित्य-L1*" },
        say: {
          en: "In 2023, ISRO launched Aditya L1 to study the Sun. This picture was taken by its camera!",
          hi: "2023 में ISRO ने सूरज को समझने के लिए आदित्य L1 भेजा। यह तस्वीर उसी के कैमरे ने ली है!",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/71/Solar_Panels_in_Farm%2C_India.jpg/960px-Solar_Panels_in_Farm%2C_India.jpg", fit: "cover",
          credit: "PWRDF", license: "CC BY 2.0", page: "https://commons.wikimedia.org/wiki/File:Solar_Panels_in_Farm,_India.jpg" },
        headline: { en: "Free power from the *sky*", hi: "आसमान से *मुफ़्त* बिजली" },
        say: {
          en: "And solar panels turn this free sunlight into electricity for our homes and farms.",
          hi: "और सोलर पैनल इसी मुफ़्त धूप को हमारे घरों और खेतों की बिजली में बदल देते हैं।",
        },
      },
    ],
  },
  {
    id: "rust", subject: "Chemistry", emoji: "🧪", accent: "saffron", topic: "Rusting of iron",
    title: { en: "Why does iron rust?", hi: "लोहे में जंग क्यों लगती है?" },
    scenes: [
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a4/Rust_on_iron.jpg/1280px-Rust_on_iron.jpg", fit: "cover",
          credit: "Laitr Keiows", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Rust_on_iron.jpg" },
        headline: { en: "Orange and *flaky*", hi: "नारंगी और *भुरभुरा*" },
        say: {
          en: "Leave iron out in the rain, and it slowly turns orange and flaky. That is rust.",
          hi: "लोहे को बारिश में छोड़ दीजिए, धीरे-धीरे वह नारंगी और भुरभुरा हो जाता है। यही है जंग।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f8/Blue_Metal_Water_Drops_DTXR-WT-1.jpg/1280px-Blue_Metal_Water_Drops_DTXR-WT-1.jpg", fit: "cover",
          credit: "Shadowmeld Photography", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Blue_Metal_Water_Drops_DTXR-WT-1.jpg" },
        headline: { en: "Iron + *oxygen* + *water*", hi: "लोहा + *ऑक्सीजन* + *पानी*" },
        motion: { kind: "reaction", items: [{ emoji: "🔩", label: { en: "Iron", hi: "लोहा" } }, { emoji: "💧", label: { en: "Oxygen + water", hi: "ऑक्सीजन + पानी" } }, { emoji: "🟫", label: { en: "Rust", hi: "जंग" } }] },
        say: {
          en: "Iron meets oxygen and water. They react, and a brand-new substance forms: rust! Take away either one, and rusting stops.",
          hi: "लोहा ऑक्सीजन और पानी से मिलता है। ये प्रतिक्रिया करते हैं, और एक नया पदार्थ बनता है — जंग! इनमें से एक भी हटा दें, तो जंग रुक जाती है।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4b/DFC_1141_Close-up_of_a_weathered_blue_cleat_with_a_rusted_metal_ring_and_frayed_rope_on_an_old_boat_sunlit_and_textured.jpg/1280px-DFC_1141_Close-up_of_a_weathered_blue_cleat_with_a_rusted_metal_ring_and_frayed_rope_on_an_old_boat_sunlit_and_textured.jpg", fit: "cover",
          credit: "PattayaPatrol", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:DFC_1141_Close-up_of_a_weathered_blue_cleat_with_a_rusted_metal_ring_and_frayed_rope_on_an_old_boat_sunlit_and_textured.jpg" },
        headline: { en: "A brand-new *chemical*", hi: "एक नया *रसायन*" },
        stat: { en: "Fe₂O₃·xH₂O", hi: "Fe₂O₃·xH₂O" },
        say: {
          en: "The new substance is hydrated iron oxide. It is weak and crumbly, not strong like iron.",
          hi: "जो नया पदार्थ बनता है वह है हाइड्रेटेड आयरन ऑक्साइड। यह लोहे जैसा मज़बूत नहीं, बल्कि कमज़ोर और भुरभुरा होता है।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/93/Big_rusty_boat_in_Moynaq.JPG/960px-Big_rusty_boat_in_Moynaq.JPG", fit: "cover",
          credit: "TwoWings", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Big_rusty_boat_in_Moynaq.JPG" },
        headline: { en: "Salt makes it *faster*", hi: "नमक से और *तेज़*" },
        say: {
          en: "Salty water speeds up rusting. That is why ships and seaside railings rust so quickly.",
          hi: "खारा पानी जंग को और तेज़ कर देता है। इसलिए जहाज़ और समुद्र किनारे की रेलिंग जल्दी जंग खाती हैं।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/be/Howrah_Bridge_Kolkata_Photography_by_Argha_Mallick_03.jpg/1280px-Howrah_Bridge_Kolkata_Photography_by_Argha_Mallick_03.jpg", fit: "cover",
          credit: "Arghamallick5151", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Howrah_Bridge_Kolkata_Photography_by_Argha_Mallick_03.jpg" },
        headline: { en: "Paint = *shield*", hi: "पेंट = *ढाल*" },
        say: {
          en: "Paint, oil or a coat of zinc keeps air and water away. That is how big bridges like Howrah Bridge are protected.",
          hi: "पेंट, तेल या ज़िंक की परत हवा और पानी को दूर रखती है। हावड़ा ब्रिज जैसे बड़े पुल ऐसे ही बचाए जाते हैं।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/da/Delhi_Iron_pillar%2C_2010-09-27.jpg/960px-Delhi_Iron_pillar%2C_2010-09-27.jpg", fit: "cover",
          credit: "Aiwok", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Delhi_Iron_pillar,_2010-09-27.jpg" },
        headline: { en: "India's *rust-proof* pillar", hi: "भारत का *जंगरोधी* स्तंभ" },
        stat: { en: "1,600 years", hi: "1600 साल" },
        pan: "up",
        say: {
          en: "The Iron Pillar of Delhi has stood for about sixteen hundred years and has barely rusted. Ancient Indian metal magic!",
          hi: "दिल्ली का लौह स्तंभ लगभग सोलह सौ साल से खड़ा है और उसमें मुश्किल से ही जंग लगी है। प्राचीन भारत का कमाल!",
        },
      },
    ],
  },
  {
    id: "pythagoras", subject: "Mathematics", emoji: "📐", accent: "saffron", topic: "Pythagoras theorem",
    title: { en: "The 3-4-5 magic", hi: "3-4-5 का जादू" },
    scenes: [
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/af/All_Gizah_Pyramids.jpg/1280px-All_Gizah_Pyramids.jpg", fit: "cover",
          credit: "Ricardo Liberato", license: "CC BY-SA 2.0", page: "https://commons.wikimedia.org/wiki/File:All_Gizah_Pyramids.jpg" },
        headline: { en: "The *perfect corner*", hi: "*बिल्कुल सही* कोना" },
        say: {
          en: "For thousands of years, builders have used one simple rule to make perfect right angles.",
          hi: "हज़ारों सालों से कारीगर एक आसान नियम से बिल्कुल सही समकोण बनाते आए हैं।",
        },
      },
      {
        overlay: "pyth-triangle",
        headline: { en: "A *right* triangle", hi: "एक *समकोण* त्रिभुज" },
        say: {
          en: "Take a right-angled triangle. Call the two shorter sides a and b, and the longest side c.",
          hi: "एक समकोण त्रिभुज लीजिए। दोनों छोटी भुजाओं को a और b कहिए, और सबसे लंबी भुजा को c।",
        },
      },
      {
        overlay: "pyth-squares",
        headline: { en: "*a² + b² = c²*", hi: "*a² + b² = c²*" },
        say: {
          en: "Build a square on each side. The two small squares together exactly equal the big one.",
          hi: "हर भुजा पर एक वर्ग बनाइए। दोनों छोटे वर्ग मिलकर ठीक बड़े वर्ग के बराबर होते हैं।",
        },
      },
      {
        overlay: "pyth-345",
        headline: { en: "*9 + 16 = 25*", hi: "*9 + 16 = 25*" },
        say: {
          en: "Try sides 3 and 4. Nine plus sixteen is twenty five, so the long side is exactly 5.",
          hi: "भुजाएँ 3 और 4 लीजिए। नौ और सोलह मिलकर पच्चीस — यानी लंबी भुजा ठीक 5 है।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/24/Bas-relief_of_Baudhayana.jpg/1280px-Bas-relief_of_Baudhayana.jpg", fit: "cover",
          credit: "Pur 0 0", license: "CC0", page: "https://commons.wikimedia.org/wiki/File:Bas-relief_of_Baudhayana.jpg" },
        headline: { en: "India knew it *too*", hi: "भारत भी *जानता* था" },
        say: {
          en: "In India, Baudhayana described this rule in the Shulba Sutras, one of its oldest written records.",
          hi: "भारत में बौधायन ने शुल्ब सूत्र में इस नियम का वर्णन किया — यह इसके सबसे पुराने लिखित रिकॉर्ड में से एक है।",
        },
      },
      {
        image: { src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a1/Ladder_leaning_against_the_wall%2C_Peabody_Institute%2C_1_E._Mount_Vernon_Place%2C_Baltimore%2C_MD_21202_%2839542915101%29.jpg/1280px-Ladder_leaning_against_the_wall%2C_Peabody_Institute%2C_1_E._Mount_Vernon_Place%2C_Baltimore%2C_MD_21202_%2839542915101%29.jpg", fit: "cover",
          credit: "Baltimore Heritage from Baltimore, MD, USA", license: "CC0", page: "https://commons.wikimedia.org/wiki/File:Ladder_leaning_against_the_wall,_Peabody_Institute,_1_E._Mount_Vernon_Place,_Baltimore,_MD_21202_(39542915101).jpg" },
        headline: { en: "Used *everywhere*", hi: "*हर जगह* काम का" },
        say: {
          en: "Today it helps measure ladders, TV screens, maps and even GPS distances.",
          hi: "आज यह सीढ़ी, टीवी स्क्रीन, नक्शे और GPS की दूरियाँ नापने तक में काम आता है।",
        },
      },
    ],
  },
];
