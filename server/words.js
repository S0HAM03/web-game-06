/**
 * words.js — Wordle Battle Word Bank
 * Fetches comprehensive word list from internet at startup.
 * Falls back to built-in medium-hard list if offline.
 */

const https = require('https');
const http = require('http');

// ── Very common / easy words excluded from ANSWERS ─────────────
const EASY_SET = new Set([
  'about','above','abuse','actor','admit','after','again','agent','agree','alert',
  'alike','alive','alley','allow','alone','along','alter','angel','anger','angry',
  'apple','apply','argue','arise','aside','asked','avoid','award','aware','awful',
  'badly','basic','began','being','below','bench','birth','black','blade','blame',
  'blank','blast','blend','blind','blood','bloom','blown','board','boost','bound',
  'brain','brand','brave','bread','break','breed','brick','brief','bring','broad',
  'brown','brush','build','built','burst','buyer','candy','carry','catch','cause',
  'chair','check','chess','chest','chief','child','china','chose','civic','civil',
  'claim','class','clean','clear','clerk','click','clock','clone','close','coach',
  'coast','color','could','count','court','cover','craft','crane','crash','crazy',
  'cream','crime','cross','crowd','cycle','daily','dance','death','delay','depth',
  'dirty','dizzy','doing','donor','doubt','dough','drain','drama','drawn','dream',
  'drink','drive','drove','dying','eagle','early','earth','eight','elite','email',
  'empty','enjoy','enter','entry','equal','error','essay','event','every','exact',
  'exist','extra','faith','false','fancy','fatal','feast','fever','field','fifth',
  'fifty','fight','final','first','fixed','floor','focus','force','forth','found',
  'frame','fresh','front','fruit','fully','funny','ghost','giant','given','glass',
  'glide','globe','going','grace','grade','grain','grand','graph','grasp','grass',
  'grave','great','green','greet','grief','groan','gross','group','grown','guess',
  'guest','guide','guild','guise','gusto','habit','happy','harsh','heart','heavy',
  'hello','herbs','honor','horse','hotel','house','human','hurry','ideal','image',
  'imply','inner','input','issue','ivory','joint','judge','juice','juicy','jumbo',
  'karma','knife','knock','known','label','large','laser','later','laugh','layer',
  'learn','lease','leave','legal','lemon','level','light','limit','local','logic',
  'loose','lucky','lying','magic','major','maker','march','match','media','metal',
  'might','minor','model','money','month','moral','motor','motto','mouse','mouth',
  'movie','music','naval','never','night','noble','noise','north','noted','novel',
  'nurse','occur','ocean','offer','often','onset','order','organ','other','outer',
  'owned','paint','panic','paper','party','pasta','pause','peace','phone','photo',
  'pilot','pizza','place','plain','plant','plate','point','power','press','price',
  'pride','prime','print','proof','prose','proud','prove','queen','query','quick',
  'quiet','radio','raise','rally','range','rapid','ratio','reach','react','realm',
  'rebel','refer','rider','rifle','right','risky','rival','river','robot','rocky',
  'rough','round','route','ruler','sadly','saint','sauce','scale','scene','sense',
  'serve','seven','shame','shape','share','shark','sharp','sheep','shelf','shell',
  'shirt','shock','shore','short','shout','shown','silly','sixth','sixty','skill',
  'slate','sleep','smile','smoke','solid','solve','sorry','south','space','speak',
  'speed','spend','spite','split','spoke','sport','spray','stack','stage','stain',
  'stake','stand','stark','start','state','stays','steel','steep','stern','still',
  'stock','stone','stood','storm','story','straw','study','stuff','style','sugar',
  'super','sweet','swift','sword','table','taken','taste','teach','tears','theme',
  'there','these','thick','thing','think','those','three','threw','throw','tiger',
  'tight','tired','title','today','token','tooth','total','touch','tough','tower',
  'toxic','track','trade','trail','train','treat','trend','trial','tribe','tried',
  'truck','truly','trunk','trust','truth','ultra','under','union','unite','until',
  'upper','urban','usage','usual','utter','valid','value','vapor','vault','video',
  'viral','virus','visit','vital','vivid','voice','voter','waste','watch','water',
  'weary','where','which','while','white','whose','witch','woman','women','world',
  'worry','worse','worst','worth','would','write','wrote','young','youth','zebra',
]);

// ── Built-in medium-hard answer words (fallback + seed) ─────────
const BUILTIN_ANSWERS = [
  'abbey','abyss','acorn','acrid','adage','adorn','aegis','affix','afoot',
  'agave','aglow','agony','agile','aisle','algae','aloft','amaze','amble',
  'amend','amino','amiss','amity','ample','amuse','ankle','annex','anvil',
  'aphid','ardor','argot','atone','augur','avail','axiom','azure','badge',
  'baste','baton','bayou','beady','beige','bevel','birch','bitty','blimp',
  'blithe','bloat','bloke','booze','bossy','botch','bough','brace','brash',
  'brawn','brisk','broil','brood','broom','broth','brunt','cacao','cadet',
  'cairn','caper','capon','carve','cedar','chafe','chaff','chant','chasm',
  'chive','chord','chore','chuck','chump','churn','cinch','cleat','cleft',
  'cling','clink','clomp','clout','coax','cobalt','codex','comet','comfy',
  'crone','croon','crude','crust','crypt','daisy','dally','datum','daunt',
  'delta','dense','depot','derby','deter','divan','dodge','dogma','dowel',
  'downy','drape','drawl','dregs','drool','droop','duvet','dwell','easel',
  'edict','egret','elbow','elope','embed','emote','erupt','evade','evoke',
  'exert','exile','exude','fable','facet','flank','flare','flown','fluff',
  'flunk','glean','gloat','gloss','gorge','gouge','graze','gripe','gruel',
  'guava','guile','gulch','gully','haste','hatch','heave','horde','homer',
  'hound','hover','hunch','hutch','igloo','impel','infer','ingot','inlay',
  'inlet','joust','knave','knelt','laden','ladle','larva','latch','latte',
  'leapt','ledge','lemma','levee','llama','lobby','lofty','lyric','maple',
  'marsh','maxim','moose','moult','mural','murky','musty','naive','navel',
  'notch','oaken','omega','onion','optic','ovoid','pagan','papal','parry',
  'patio','paved','peeve','pique','plank','plush','poach','poise','polyp',
  'preen','prism','privy','psalm','puffy','quirk','radon','raven','rebus',
  'relic','repel','resin','retch','revel','rhyme','ridge','rigor','rodeo',
  'roomy','rupee','rustle','salve','salvo','savvy','scald','scalp','scaly',
  'scamp','scram','scrod','shawl','sheen','sheer','shone','shrub','shrug',
  'shuck','shunt','sigma','simmer','sinew','siren','skew','skimp','slack',
  'slain','slang','sleet','sleek','slick','slimy','slink','sloth','slump',
  'slunk','smirk','smite','smock','snare','snide','snore','snort','snout',
  'snuff','soggy','soothe','spawn','speck','spiel','spiky','spire','spoof',
  'spoon','spout','sprig','spunk','spurn','staid','stoic','stoop','strife',
  'stung','stunk','swipe','swirl','syrup','talon','taunt','tawny','thane',
  'thorn','throe','throb','throng','thump','tiara','tithe','torso','totem',
  'truce','trump','tuber','twerp','twirl','udder','ulcer','uncut','unfed',
  'unfit','unmet','unwed','vaunt','venom','verge','vigor','viper','vogue',
  'vouch','waltz','warty','waver','whelp','whiff','whirl','windy','witty',
  'wizen','wreak','wrest','wring','yearn','zesty','zilch','zippy','aphid',
  'arbor','askew','attic','banjo','baron','belle','biome','blare','bliss',
  'blunt','braid','breve','brine','brooch','burly','cabal','cache','cagey',
  'cameo','catty','chasm','chide','cilia','clasp','clown','comet','conga',
  'corps','covet','covey','coven','credo','crimp','crony','cupid','curry',
  'cygnet','decoy','depot','derby','detox','dingo','divot','dowry','druid',
  'dunce','dwarf','easel','envoy','epoxy','equip','ethic','evict','exalt',
  'expel','extol','farce','fatal','fauna','ferret','feral','fetid','fiend',
  'fjord','flair','flaunt','foist','folio','folly','frail','freak','frond',
  'froth','frugal','fungi','funky','gable','gaunt','gauze','gecko','girth',
  'glare','glyph','gnome','golem','graft','grimy','griot','gripe','grout',
  'growl','gruel','guise','gusto','gwish','haiku','haste','haunt','haven',
  'havoc','hippo','hiked','hoard','hoary','hobby','hodge','hovel','hunky',
  'idiom','igloo','impel','inane','inept','inert','ingot','inure','irony',
  'jaunt','jazzy','jilted','joist','joker','julep','karst','kayak','kneel',
  'knoll','kudzu','kyrie','lanky','lapel','lapse','latent','leafy','leeward',
  'lethal','limbo','liner','lingo','livid','loamy','loath','loopy','lorry',
  'lowly','lucid','lumpy','lusty','macaw','madly','mafia','mangy','manly',
  'manor','mealy','melee','mercy','messy','mimic','mirth','moody','moult',
  'mucky','mulch','mushy','myrrh','nadir','niche','nitty','noble','notch',
  'nymph','octet','offal','onset','opine','opium','orbit','otter','ovary',
  'oxide','ozone','paddy','pagan','parch','patsy','peach','pearl','pebble',
  'pedal','perch','peril','petty','plaid','plank','pleat','plumb','plume',
  'plump','plunk','poach','podium','polka','poppy','poplar','porch','pouty',
  'prank','proxy','pubic','pulpy','punch','pupil','purse','pygmy','quaff',
  'quail','qualm','quark','quasar','rabbi','rabid','raven','regal','reign',
  'relax','repay','rogue','roman','rugby','runic','rural','rusty','saggy',
  'salsa','scamp','scone','scout','screw','seize','sigma','skimp','skulk',
  'smelt','snaky','snide','snooty','squat','stave','stomp','strut','stump',
  'stymy','suave','sulky','surly','swamp','swear','sweep','swept','taboo',
  'tangy','tapir','tardy','taunt','tawny','tepid','terse','testy','thatch',
  'thorn','thump','tidal','tithe','topaz','torrent','trice','tripe','trivia',
  'troop','trove','tufted','tumid','tunic','turbo','tweak','twerp','typify',
  'udder','unify','unruly','upend','usurp','uvula','vagus','vapid','venom',
  'verge','virile','vista','visor','vitae','vixen','vizor','vogue','voila',
  'vouch','wacky','wagon','waist','warty','waver','whack','wheat','whelp',
  'whirl','windy','wizen','woozy','wormy','wreak','wring','yearn','zesty',
];

// Remove duplicates
const UNIQUE_ANSWERS = [...new Set(BUILTIN_ANSWERS)];

// Runtime state
let WORD_LIST = [...UNIQUE_ANSWERS];
let VALID_GUESSES = new Set([...UNIQUE_ANSWERS, ...EASY_SET]);

function fetchURL(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { timeout: 10000 }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchURL(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function initWords() {
  // Source 1: comprehensive valid Wordle guess list (~14k words)
  const GUESS_URL = 'https://raw.githubusercontent.com/tabatkins/wordle-list/main/words';
  // Source 2: curated medium-difficulty answer list  
  const ANSWER_URL = 'https://raw.githubusercontent.com/cfreshman/a03ef2cba789d8cf00c08f767e0fad7b/raw/28804271a741f83b64d0e23b3b53d7e9ac61b2ca/wordle-nyt-answers-alphabetical.txt';

  let fetchedGuesses = [];
  let fetchedAnswers = [];

  try {
    console.log('[WORDS] Fetching word list from internet...');
    const [guessRaw, answerRaw] = await Promise.allSettled([
      fetchURL(GUESS_URL),
      fetchURL(ANSWER_URL),
    ]);

    if (guessRaw.status === 'fulfilled') {
      fetchedGuesses = guessRaw.value.trim().split('\n')
        .map(w => w.trim().toLowerCase())
        .filter(w => /^[a-z]{5}$/.test(w));
      console.log(`[WORDS] Fetched ${fetchedGuesses.length} valid guess words`);
    }

    if (answerRaw.status === 'fulfilled') {
      fetchedAnswers = answerRaw.value.trim().split('\n')
        .map(w => w.trim().toLowerCase())
        .filter(w => /^[a-z]{5}$/.test(w));
      console.log(`[WORDS] Fetched ${fetchedAnswers.length} curated answer words`);
    }
  } catch (err) {
    console.warn('[WORDS] Fetch error:', err.message);
  }

  // Build valid guesses set: all fetched + built-in
  const allGuesses = [...fetchedGuesses, ...UNIQUE_ANSWERS];
  VALID_GUESSES = new Set(allGuesses.map(w => w.toLowerCase()));

  // Build answer list: full NYT answers (easy + medium) + common words
  // We intentionally include easy/common words for a fun, accessible difficulty
  const curated = fetchedAnswers.length > 0
    ? fetchedAnswers  // use ALL fetched answers, no difficulty filter
    : [];

  const easyWords = [...EASY_SET]; // also include the common words as valid answers
  const combined = [...new Set([...easyWords, ...curated, ...UNIQUE_ANSWERS])];
  WORD_LIST = combined.filter(w => /^[a-z]{5}$/.test(w));

  console.log(`[WORDS] Final: ${WORD_LIST.length} answer words, ${VALID_GUESSES.size} valid guesses`);
}

function getRandomWord() {
  const w = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
  return w.toUpperCase();
}

function isValidWord(word) {
  return VALID_GUESSES.has(word.toLowerCase());
}

module.exports = { initWords, getRandomWord, isValidWord };
