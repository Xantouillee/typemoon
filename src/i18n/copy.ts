/**
 * The settings copy, in every language the app types in.
 *
 * This is a *typed* dictionary rather than the flat `Dict` in `strings.ts`: with
 * twenty-odd settings, a missing translation in a flat map is a silent fallback
 * to English that nobody notices for months. Here it is a compile error.
 *
 * Each row carries three things, and all three earn their place:
 *   label — what the setting is called
 *   hint  — what it does, in one plain sentence
 *   tip   — a concrete example, for the settings whose behaviour is hard to
 *           picture from a description alone
 */

export interface RowCopy {
  label: string;
  hint: string;
  tip?: string;
}

export type SectionId = 'sound' | 'typing' | 'appearance' | 'backdrop' | 'theme';

export type RowId =
  | 'sound'
  | 'voice'
  | 'volume'
  | 'errorSound'
  | 'timeWarning'
  | 'difficulty'
  | 'stopOnError'
  | 'confidence'
  | 'freedom'
  | 'lazy'
  | 'indicateTypos'
  | 'caretStyle'
  | 'caretMotion'
  | 'highlight'
  | 'typedText'
  | 'textSize'
  | 'speedUnit'
  | 'capsWarning'
  | 'backdrop'
  | 'bgVisible'
  | 'cover'
  | 'blur'
  | 'pageTheme'
  | 'language';

export type OptId =
  | 'off'
  | 'on'
  | 'max'
  | 'letter'
  | 'word'
  | 'normal'
  | 'expert'
  | 'master'
  | 'below'
  | 'replace'
  | 'nib'
  | 'block'
  | 'outline'
  | 'under'
  | 'snap'
  | 'slow'
  | 'medium'
  | 'fast'
  | 'keep'
  | 'fade'
  | 'dots'
  | 'hide'
  | 'wpm'
  | 'cpm'
  | 'wps'
  | 'voice'
  | 'damage'
  | 'punch'
  | 'buzz'
  | 'light'
  | 'caramel'
  | 'dark';

export interface Copy {
  eyebrow: string;
  title: string;
  reset: string;
  resetConfirm: string;
  previewLabel: string;
  /** shown when the preview is demonstrating a rule rather than just typing */
  previewBlocked: string;
  previewFailedMaster: string;
  previewFailedExpert: string;
  previewWarning: string;
  previewRestart: string;
  sections: Record<SectionId, { title: string; blurb: string }>;
  rows: Record<RowId, RowCopy>;
  opt: Record<OptId, string>;
}

const en: Copy = {
  eyebrow: 'all settings',
  title: 'Set your hand.',
  reset: 'Reset all',
  resetConfirm: 'Reset every setting to its default?',
  previewLabel: 'live preview — type here',
  previewBlocked: 'Blocked — fix the mistake to carry on.',
  previewFailedMaster: 'Master: one wrong key ended the run.',
  previewFailedExpert: 'Expert: that word went in with a mistake in it.',
  previewWarning: 'That tick is your time warning.',
  previewRestart: 'restart the sample',
  sections: {
    sound: { title: 'Sound', blurb: 'How the keyboard feels in your ears.' },
    typing: {
      title: 'Typing',
      blurb: 'What counts as a mistake, and what a mistake costs you.',
    },
    appearance: {
      title: 'Appearance',
      blurb: 'How the words and the caret present themselves.',
    },
    backdrop: {
      title: 'Backdrop',
      blurb: 'A moving scene behind practice and the arcade, held back so the words always win.',
    },
    theme: { title: 'Theme & language', blurb: 'The look of the page and the words you type.' },
  },
  rows: {
    sound: { label: 'Keyboard sound', hint: 'Play a sound on every keystroke.' },
    voice: {
      label: 'Voice',
      hint: 'What the keyboard is made of. Every voice is synthesised from scratch — nothing is downloaded, nothing is sampled.',
      tip: 'Click a voice to hear it. The melody voices play a whole tune across your run, one note per letter — keep typing cleanly and you reach the end of the piece.',
    },
    volume: { label: 'Volume', hint: 'How loud the keystrokes and effects are.' },
    errorSound: {
      label: 'Error sound',
      hint: 'What a wrong key sounds like.',
      tip: '“Voice” keeps the mistake in the same material as the keyboard, so nothing jars.',
    },
    timeWarning: {
      label: 'Time warning',
      hint: 'A double tick shortly before a timed test runs out, so the end never ambushes you.',
    },
    difficulty: {
      label: 'Difficulty',
      hint: 'How unforgiving the run is. Normal never ends early.',
      tip: 'Expert ends the run if you press space on a word containing a mistake. Master ends it on a single wrong key.',
    },
    stopOnError: {
      label: 'Stop on error',
      hint: 'Refuse further input until a mistake is corrected — you cannot type past a typo.',
      tip: '“Letter” freezes instantly; “word” lets you finish the word before it insists.',
    },
    confidence: {
      label: 'Confidence',
      hint: 'Limit how far back you may go, to break the habit of second-guessing.',
      tip: '“On” pins you inside the current word; “max” removes backspace altogether.',
    },
    freedom: {
      label: 'Freedom',
      hint: 'Allow deleting characters you already typed correctly. Off commits every correct keystroke.',
    },
    lazy: {
      label: 'Lazy mode',
      hint: 'Accept a plain letter where the text wants an accent.',
      tip: 'Type “e” for “é”, “u” for “ü”, “n” for “ñ”. Useful in French, Spanish and German.',
    },
    indicateTypos: {
      label: 'Indicate typos',
      hint: 'Show the character you actually pressed, not just that you were wrong.',
      tip: '“Below” prints it under the word; “replace” swaps it into the text.',
    },
    caretStyle: { label: 'Caret style', hint: 'The shape of the marker that tracks your position.' },
    caretMotion: { label: 'Caret motion', hint: 'How the caret travels between characters.' },
    highlight: {
      label: 'Highlight',
      hint: 'Dim everything except what you are typing right now, to narrow your focus.',
    },
    typedText: { label: 'Typed text', hint: 'What happens to the words once you have passed them.' },
    textSize: { label: 'Text size', hint: 'The size of the words in the typing area.' },
    speedUnit: {
      label: 'Speed unit',
      hint: 'Words per minute, characters per minute, or words per second.',
    },
    capsWarning: { label: 'Caps lock warning', hint: 'Show a warning while caps lock is on.' },
    backdrop: {
      label: 'Scene',
      hint: 'The moving image behind practice and the arcade.',
      tip: 'Each card shows the real scene under the real cover, so what you pick is what you get.',
    },
    bgVisible: {
      label: 'Show the backdrop',
      hint: 'Hide the scene without forgetting which one you chose.',
      tip: 'The eye in the header does the same thing, mid-run, without coming here.',
    },
    cover: {
      label: 'Cover',
      hint: 'How much of the page colour sits over the image. Raise it if anything is hard to read.',
      tip: 'It cannot go low enough to make the text illegible — that floor is not adjustable.',
    },
    blur: {
      label: 'Blur',
      hint: 'Softens the image so its detail stops competing with the words.',
      tip: 'At zero the pixel art stays perfectly sharp.',
    },
    pageTheme: { label: 'Page theme', hint: 'The paper you are typing on.' },
    language: {
      label: 'Language',
      hint: 'Changes the words you type, the keyboard layout, and the language of the interface.',
    },
  },
  opt: {
    off: 'off',
    on: 'on',
    max: 'max',
    letter: 'letter',
    word: 'word',
    normal: 'normal',
    expert: 'expert',
    master: 'master',
    below: 'below',
    replace: 'replace',
    nib: 'nib',
    block: 'block',
    outline: 'outline',
    under: 'under',
    snap: 'snap',
    slow: 'slow',
    medium: 'medium',
    fast: 'fast',
    keep: 'keep',
    fade: 'fade',
    dots: 'dots',
    hide: 'hide',
    wpm: 'wpm',
    cpm: 'cpm',
    wps: 'wps',
    voice: 'voice',
    damage: 'damage',
    punch: 'punch',
    buzz: 'buzz',
    light: 'ink on cream',
    caramel: 'burnt caramel',
    dark: 'midnight ink',
  },
};

const fr: Copy = {
  eyebrow: 'tous les réglages',
  title: 'Réglez votre main.',
  reset: 'Tout réinitialiser',
  resetConfirm: 'Remettre tous les réglages par défaut ?',
  previewLabel: 'aperçu en direct — tapez ici',
  previewBlocked: 'Bloqué — corrigez la faute pour continuer.',
  previewFailedMaster: 'Master : une seule touche fausse a mis fin à la session.',
  previewFailedExpert: 'Expert : ce mot est passé avec une faute dedans.',
  previewWarning: 'Ce tic-tac, c’est votre alerte de temps.',
  previewRestart: 'relancer l’exemple',
  sections: {
    sound: { title: 'Son', blurb: 'Ce que le clavier fait à vos oreilles.' },
    typing: {
      title: 'Frappe',
      blurb: 'Ce qui compte comme une faute, et ce qu’une faute vous coûte.',
    },
    appearance: {
      title: 'Apparence',
      blurb: 'La façon dont les mots et le curseur se présentent.',
    },
    backdrop: {
      title: 'Décor',
      blurb: 'Une scène animée derrière la pratique et l’arcade, assez retenue pour que les mots gagnent toujours.',
    },
    theme: { title: 'Thème et langue', blurb: 'L’allure de la page et les mots que vous tapez.' },
  },
  rows: {
    sound: { label: 'Son du clavier', hint: 'Jouer un son à chaque frappe.' },
    voice: {
      label: 'Voix',
      hint: 'La matière dont le clavier est fait. Chaque voix est synthétisée de zéro — rien n’est téléchargé, rien n’est échantillonné.',
      tip: 'Cliquez sur une voix pour l’entendre. Les voix mélodiques jouent un air entier au fil de la session, une note par lettre — tapez proprement et vous atteindrez la fin du morceau.',
    },
    volume: { label: 'Volume', hint: 'Le niveau des frappes et des effets.' },
    errorSound: {
      label: 'Son d’erreur',
      hint: 'Le bruit que fait une touche fausse.',
      tip: '« Voix » garde la faute dans la matière du clavier : rien ne détonne.',
    },
    timeWarning: {
      label: 'Alerte de temps',
      hint: 'Un double tic peu avant la fin d’un test chronométré, pour que la fin ne vous surprenne jamais.',
    },
    difficulty: {
      label: 'Difficulté',
      hint: 'La sévérité de la session. « Normal » ne s’arrête jamais avant la fin.',
      tip: 'Expert arrête la session si vous validez un mot contenant une faute. Master l’arrête à la première touche fausse.',
    },
    stopOnError: {
      label: 'Arrêt sur faute',
      hint: 'Refuser toute frappe tant que la faute n’est pas corrigée — impossible de dépasser une coquille.',
      tip: '« Lettre » bloque aussitôt ; « mot » vous laisse finir le mot avant d’insister.',
    },
    confidence: {
      label: 'Confiance',
      hint: 'Limiter le retour en arrière, pour perdre l’habitude de vous corriger sans cesse.',
      tip: '« Activé » vous garde dans le mot en cours ; « max » supprime complètement la touche retour.',
    },
    freedom: {
      label: 'Liberté',
      hint: 'Autoriser l’effacement de caractères déjà tapés correctement. Désactivé, chaque frappe juste est définitive.',
    },
    lazy: {
      label: 'Mode paresseux',
      hint: 'Accepter une lettre simple là où le texte demande un accent.',
      tip: 'Tapez « e » pour « é », « u » pour « ü », « n » pour « ñ ». Pratique en français, en espagnol et en allemand.',
    },
    indicateTypos: {
      label: 'Montrer les fautes',
      hint: 'Afficher le caractère réellement tapé, pas seulement le fait que c’était faux.',
      tip: '« Dessous » l’imprime sous le mot ; « remplacer » l’insère dans le texte.',
    },
    caretStyle: { label: 'Forme du curseur', hint: 'La forme du repère qui suit votre position.' },
    caretMotion: { label: 'Mouvement du curseur', hint: 'La façon dont le curseur passe d’un caractère à l’autre.' },
    highlight: {
      label: 'Mise en avant',
      hint: 'Estomper tout sauf ce que vous tapez à l’instant, pour resserrer l’attention.',
    },
    typedText: { label: 'Texte tapé', hint: 'Ce que deviennent les mots une fois dépassés.' },
    textSize: { label: 'Taille du texte', hint: 'La taille des mots dans la zone de frappe.' },
    speedUnit: {
      label: 'Unité de vitesse',
      hint: 'Mots par minute, caractères par minute ou mots par seconde.',
    },
    capsWarning: { label: 'Alerte majuscules', hint: 'Prévenir quand le verrouillage majuscules est actif.' },
    backdrop: {
      label: 'Scène',
      hint: 'L’image animée derrière la pratique et l’arcade.',
      tip: 'Chaque vignette montre la vraie scène sous le vrai voile : ce que vous choisissez est ce que vous aurez.',
    },
    bgVisible: {
      label: 'Afficher le décor',
      hint: 'Masquer la scène sans oublier celle que vous avez choisie.',
      tip: 'L’œil dans l’en-tête fait la même chose, en pleine session, sans passer par ici.',
    },
    cover: {
      label: 'Voile',
      hint: 'La quantité de couleur de page posée sur l’image. Montez-la si quoi que ce soit se lit mal.',
      tip: 'Elle ne peut pas descendre assez bas pour rendre le texte illisible : ce plancher n’est pas réglable.',
    },
    blur: {
      label: 'Flou',
      hint: 'Adoucit l’image pour que ses détails cessent de concurrencer les mots.',
      tip: 'À zéro, le pixel art reste parfaitement net.',
    },
    pageTheme: { label: 'Thème de page', hint: 'Le papier sur lequel vous tapez.' },
    language: {
      label: 'Langue',
      hint: 'Change les mots que vous tapez, la disposition du clavier et la langue de l’interface.',
    },
  },
  opt: {
    off: 'désactivé',
    on: 'activé',
    max: 'max',
    letter: 'lettre',
    word: 'mot',
    normal: 'normal',
    expert: 'expert',
    master: 'master',
    below: 'dessous',
    replace: 'remplacer',
    nib: 'plume',
    block: 'bloc',
    outline: 'contour',
    under: 'souligné',
    snap: 'net',
    slow: 'lent',
    medium: 'moyen',
    fast: 'rapide',
    keep: 'garder',
    fade: 'estomper',
    dots: 'points',
    hide: 'masquer',
    wpm: 'mpm',
    cpm: 'cpm',
    wps: 'mps',
    voice: 'voix',
    damage: 'dégât',
    punch: 'coup',
    buzz: 'buzz',
    light: 'encre sur crème',
    caramel: 'caramel brûlé',
    dark: 'encre de minuit',
  },
};

const es: Copy = {
  eyebrow: 'todos los ajustes',
  title: 'Ajusta tu mano.',
  reset: 'Restablecer todo',
  resetConfirm: '¿Devolver todos los ajustes a sus valores por defecto?',
  previewLabel: 'vista previa en vivo — escribe aquí',
  previewBlocked: 'Bloqueado — corrige el error para continuar.',
  previewFailedMaster: 'Master: una sola tecla equivocada ha terminado la sesión.',
  previewFailedExpert: 'Experto: esa palabra ha pasado con un error dentro.',
  previewWarning: 'Ese tic es tu aviso de tiempo.',
  previewRestart: 'reiniciar el ejemplo',
  sections: {
    sound: { title: 'Sonido', blurb: 'Cómo suena el teclado en tus oídos.' },
    typing: {
      title: 'Escritura',
      blurb: 'Qué cuenta como error y cuánto te cuesta un error.',
    },
    appearance: {
      title: 'Apariencia',
      blurb: 'Cómo se presentan las palabras y el cursor.',
    },
    backdrop: {
      title: 'Fondo',
      blurb: 'Una escena en movimiento detrás de la práctica y del arcade, contenida para que las palabras siempre ganen.',
    },
    theme: { title: 'Tema e idioma', blurb: 'El aspecto de la página y las palabras que escribes.' },
  },
  rows: {
    sound: { label: 'Sonido del teclado', hint: 'Reproducir un sonido en cada pulsación.' },
    voice: {
      label: 'Voz',
      hint: 'De qué está hecho el teclado. Cada voz se sintetiza desde cero: no se descarga nada, no se muestrea nada.',
      tip: 'Haz clic en una voz para oírla. Las voces melódicas tocan una pieza entera a lo largo de la sesión, una nota por letra: escribe limpio y llegarás al final.',
    },
    volume: { label: 'Volumen', hint: 'Cuánto suenan las pulsaciones y los efectos.' },
    errorSound: {
      label: 'Sonido de error',
      hint: 'Cómo suena una tecla equivocada.',
      tip: '«Voz» mantiene el error en el mismo material que el teclado, así nada desentona.',
    },
    timeWarning: {
      label: 'Aviso de tiempo',
      hint: 'Un doble tic poco antes de que termine una prueba cronometrada, para que el final no te sorprenda.',
    },
    difficulty: {
      label: 'Dificultad',
      hint: 'Lo implacable que es la sesión. «Normal» nunca termina antes de tiempo.',
      tip: 'Experto termina la sesión si validas una palabra con un error. Master la termina en la primera tecla equivocada.',
    },
    stopOnError: {
      label: 'Parar en el error',
      hint: 'Rechazar toda pulsación hasta corregir el error: no puedes escribir más allá de una errata.',
      tip: '«Letra» bloquea al instante; «palabra» te deja terminar la palabra antes de insistir.',
    },
    confidence: {
      label: 'Confianza',
      hint: 'Limitar cuánto puedes retroceder, para perder la costumbre de dudar de ti.',
      tip: '«Activado» te mantiene dentro de la palabra actual; «max» elimina el retroceso por completo.',
    },
    freedom: {
      label: 'Libertad',
      hint: 'Permitir borrar caracteres ya escritos correctamente. Desactivado, cada acierto queda fijado.',
    },
    lazy: {
      label: 'Modo perezoso',
      hint: 'Aceptar una letra simple donde el texto pide un acento.',
      tip: 'Escribe «e» por «é», «u» por «ü», «n» por «ñ». Útil en francés, español y alemán.',
    },
    indicateTypos: {
      label: 'Mostrar erratas',
      hint: 'Mostrar el carácter que pulsaste de verdad, no solo que fallaste.',
      tip: '«Debajo» lo imprime bajo la palabra; «sustituir» lo mete en el texto.',
    },
    caretStyle: { label: 'Forma del cursor', hint: 'La forma de la marca que sigue tu posición.' },
    caretMotion: { label: 'Movimiento del cursor', hint: 'Cómo viaja el cursor entre caracteres.' },
    highlight: {
      label: 'Resaltado',
      hint: 'Atenuar todo salvo lo que estás escribiendo ahora, para estrechar el foco.',
    },
    typedText: { label: 'Texto escrito', hint: 'Qué ocurre con las palabras una vez superadas.' },
    textSize: { label: 'Tamaño del texto', hint: 'El tamaño de las palabras en la zona de escritura.' },
    speedUnit: {
      label: 'Unidad de velocidad',
      hint: 'Palabras por minuto, caracteres por minuto o palabras por segundo.',
    },
    capsWarning: { label: 'Aviso de mayúsculas', hint: 'Avisar mientras el bloqueo de mayúsculas está activo.' },
    backdrop: {
      label: 'Escena',
      hint: 'La imagen en movimiento detrás de la práctica y del arcade.',
      tip: 'Cada tarjeta muestra la escena real bajo el velo real: lo que eliges es lo que obtienes.',
    },
    bgVisible: {
      label: 'Mostrar el fondo',
      hint: 'Ocultar la escena sin olvidar cuál elegiste.',
      tip: 'El ojo de la cabecera hace lo mismo, a mitad de sesión, sin pasar por aquí.',
    },
    cover: {
      label: 'Velo',
      hint: 'Cuánto color de página se posa sobre la imagen. Súbelo si algo cuesta leerse.',
      tip: 'No puede bajar lo bastante como para volver ilegible el texto: ese suelo no se ajusta.',
    },
    blur: {
      label: 'Desenfoque',
      hint: 'Suaviza la imagen para que su detalle deje de competir con las palabras.',
      tip: 'A cero, el pixel art se mantiene perfectamente nítido.',
    },
    pageTheme: { label: 'Tema de página', hint: 'El papel sobre el que escribes.' },
    language: {
      label: 'Idioma',
      hint: 'Cambia las palabras que escribes, la distribución del teclado y el idioma de la interfaz.',
    },
  },
  opt: {
    off: 'apagado',
    on: 'activado',
    max: 'max',
    letter: 'letra',
    word: 'palabra',
    normal: 'normal',
    expert: 'experto',
    master: 'master',
    below: 'debajo',
    replace: 'sustituir',
    nib: 'plumilla',
    block: 'bloque',
    outline: 'contorno',
    under: 'subrayado',
    snap: 'seco',
    slow: 'lento',
    medium: 'medio',
    fast: 'rápido',
    keep: 'mantener',
    fade: 'atenuar',
    dots: 'puntos',
    hide: 'ocultar',
    wpm: 'ppm',
    cpm: 'cpm',
    wps: 'pps',
    voice: 'voz',
    damage: 'daño',
    punch: 'golpe',
    buzz: 'zumbido',
    light: 'tinta sobre crema',
    caramel: 'caramelo tostado',
    dark: 'tinta de medianoche',
  },
};

const de: Copy = {
  eyebrow: 'alle Einstellungen',
  title: 'Stell deine Hand ein.',
  reset: 'Alles zurücksetzen',
  resetConfirm: 'Alle Einstellungen auf die Standardwerte zurücksetzen?',
  previewLabel: 'Live-Vorschau — hier tippen',
  previewBlocked: 'Blockiert — korrigiere den Fehler, um weiterzukommen.',
  previewFailedMaster: 'Master: eine einzige falsche Taste hat den Lauf beendet.',
  previewFailedExpert: 'Experte: dieses Wort ging mit einem Fehler durch.',
  previewWarning: 'Dieses Ticken ist deine Zeitwarnung.',
  previewRestart: 'Beispiel neu starten',
  sections: {
    sound: { title: 'Klang', blurb: 'Wie sich die Tastatur in deinen Ohren anfühlt.' },
    typing: {
      title: 'Tippen',
      blurb: 'Was als Fehler zählt — und was ein Fehler dich kostet.',
    },
    appearance: {
      title: 'Darstellung',
      blurb: 'Wie sich die Wörter und der Cursor zeigen.',
    },
    backdrop: {
      title: 'Hintergrund',
      blurb: 'Eine bewegte Szene hinter Übung und Arcade, so zurückgenommen, dass die Wörter immer gewinnen.',
    },
    theme: { title: 'Thema & Sprache', blurb: 'Das Aussehen der Seite und die Wörter, die du tippst.' },
  },
  rows: {
    sound: { label: 'Tastaturklang', hint: 'Bei jedem Anschlag einen Klang spielen.' },
    voice: {
      label: 'Klangfarbe',
      hint: 'Woraus die Tastatur gemacht ist. Jede Stimme wird von Grund auf synthetisiert — nichts wird geladen, nichts gesampelt.',
      tip: 'Klicke eine Stimme an, um sie zu hören. Die Melodie-Stimmen spielen ein ganzes Stück über den Lauf hinweg, eine Note pro Buchstabe — tippe sauber, und du kommst bis zum Schluss.',
    },
    volume: { label: 'Lautstärke', hint: 'Wie laut Anschläge und Effekte sind.' },
    errorSound: {
      label: 'Fehlerklang',
      hint: 'Wie eine falsche Taste klingt.',
      tip: '„Klangfarbe“ hält den Fehler im Material der Tastatur, dann bricht nichts aus dem Bild.',
    },
    timeWarning: {
      label: 'Zeitwarnung',
      hint: 'Ein doppeltes Ticken kurz vor Ablauf eines Zeittests, damit dich das Ende nie überrumpelt.',
    },
    difficulty: {
      label: 'Schwierigkeit',
      hint: 'Wie unnachgiebig der Lauf ist. Normal endet nie vorzeitig.',
      tip: 'Experte beendet den Lauf, wenn du ein Wort mit einem Fehler abschickst. Master beendet ihn bei einer einzigen falschen Taste.',
    },
    stopOnError: {
      label: 'Stopp bei Fehler',
      hint: 'Weitere Eingaben verweigern, bis der Fehler behoben ist — an einem Tippfehler kommst du nicht vorbei.',
      tip: '„Buchstabe“ hält sofort an; „Wort“ lässt dich das Wort erst zu Ende tippen.',
    },
    confidence: {
      label: 'Selbstvertrauen',
      hint: 'Begrenzt, wie weit du zurückgehen darfst — gegen die Gewohnheit, dich ständig zu korrigieren.',
      tip: '„An“ hält dich im aktuellen Wort; „max“ nimmt die Rücktaste ganz weg.',
    },
    freedom: {
      label: 'Freiheit',
      hint: 'Erlaubt das Löschen bereits korrekt getippter Zeichen. Aus bedeutet: jeder Treffer ist endgültig.',
    },
    lazy: {
      label: 'Fauler Modus',
      hint: 'Akzeptiert einen einfachen Buchstaben, wo der Text ein Akzentzeichen verlangt.',
      tip: 'Tippe „e“ für „é“, „u“ für „ü“, „n“ für „ñ“. Nützlich im Französischen, Spanischen und Deutschen.',
    },
    indicateTypos: {
      label: 'Tippfehler zeigen',
      hint: 'Zeigt das Zeichen, das du tatsächlich gedrückt hast — nicht nur, dass es falsch war.',
      tip: '„Darunter“ setzt es unter das Wort; „ersetzen“ schiebt es in den Text.',
    },
    caretStyle: { label: 'Cursorform', hint: 'Die Form der Marke, die deiner Position folgt.' },
    caretMotion: { label: 'Cursorbewegung', hint: 'Wie der Cursor zwischen den Zeichen wandert.' },
    highlight: {
      label: 'Hervorhebung',
      hint: 'Dimmt alles außer dem, was du gerade tippst, um den Blick zu verengen.',
    },
    typedText: { label: 'Getippter Text', hint: 'Was mit den Wörtern geschieht, sobald du vorbei bist.' },
    textSize: { label: 'Schriftgröße', hint: 'Die Größe der Wörter im Tippfeld.' },
    speedUnit: {
      label: 'Geschwindigkeitseinheit',
      hint: 'Wörter pro Minute, Zeichen pro Minute oder Wörter pro Sekunde.',
    },
    capsWarning: { label: 'Feststelltasten-Warnung', hint: 'Warnen, solange die Feststelltaste aktiv ist.' },
    backdrop: {
      label: 'Szene',
      hint: 'Das bewegte Bild hinter Übung und Arcade.',
      tip: 'Jede Karte zeigt die echte Szene unter dem echten Schleier — was du wählst, bekommst du auch.',
    },
    bgVisible: {
      label: 'Hintergrund zeigen',
      hint: 'Die Szene ausblenden, ohne zu vergessen, welche du gewählt hast.',
      tip: 'Das Auge in der Kopfzeile macht dasselbe, mitten im Lauf, ohne Umweg hierher.',
    },
    cover: {
      label: 'Schleier',
      hint: 'Wie viel Seitenfarbe über dem Bild liegt. Höher stellen, wenn sich etwas schlecht liest.',
      tip: 'Er kann nicht so weit sinken, dass der Text unlesbar wird — diese Untergrenze ist nicht verstellbar.',
    },
    blur: {
      label: 'Unschärfe',
      hint: 'Weicht das Bild auf, damit seine Details nicht mehr mit den Wörtern konkurrieren.',
      tip: 'Bei null bleibt die Pixelgrafik gestochen scharf.',
    },
    pageTheme: { label: 'Seitenthema', hint: 'Das Papier, auf dem du tippst.' },
    language: {
      label: 'Sprache',
      hint: 'Ändert die Wörter, die du tippst, das Tastaturlayout und die Sprache der Oberfläche.',
    },
  },
  opt: {
    off: 'aus',
    on: 'an',
    max: 'max',
    letter: 'Buchstabe',
    word: 'Wort',
    normal: 'normal',
    expert: 'Experte',
    master: 'Master',
    below: 'darunter',
    replace: 'ersetzen',
    nib: 'Feder',
    block: 'Block',
    outline: 'Umriss',
    under: 'Unterstrich',
    snap: 'hart',
    slow: 'langsam',
    medium: 'mittel',
    fast: 'schnell',
    keep: 'behalten',
    fade: 'verblassen',
    dots: 'Punkte',
    hide: 'verbergen',
    wpm: 'WpM',
    cpm: 'ZpM',
    wps: 'WpS',
    voice: 'Klangfarbe',
    damage: 'Schaden',
    punch: 'Schlag',
    buzz: 'Summen',
    light: 'Tinte auf Creme',
    caramel: 'gebrannter Karamell',
    dark: 'Mitternachtstinte',
  },
};

const COPY: Record<string, Copy> = { en, fr, es, de };

/** The settings copy for a language, falling back to English. */
export function copy(lang: string): Copy {
  return COPY[lang] ?? en;
}
