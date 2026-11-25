/**
 * The English source for every attendee-facing interface string (pew page, reply page, crisis panel).
 * Flat dotted keys; `{name}` marks a value filled in at runtime. The other 11 languages live in
 * the JSON files next to this one; a key missing there falls back to the English here.
 * Data (homily text, Bible passages, service steps, group names, church profile) is not here:
 * it already comes per language from the church's own records.
 */
export const EN = {
  // Words the church profile uses for the message
  'term.homily': 'Homily',
  'term.sermon': 'Sermon',

  // Tabs, titles and navigation
  'tab.service': 'Service',
  'tab.prayer': 'Prayer',
  'tab.more': 'More',
  'tab.serviceGuide': 'Service guide',
  'tab.habitCount': '7-day habit · {done}/7',
  'tab.prayerCare': 'Prayer & care',
  'title.habit': '7-day habit',
  'title.groups': 'Groups',
  'title.about': 'About this church',
  'nav.sections': 'Sections',
  'nav.home': 'Koinonia home',
  'nav.backToMore': 'Back to More',
  'nav.back': 'Back',
  'common.close': 'Close',
  'common.approvedBy': 'Approved by {name}',

  // Choosing a language
  'lang.welcomeChoose': 'Welcome. Choose your language.',
  'lang.intro': 'Follow today’s {term}, see what is happening in the service, and ask for prayer, all in your own language.',
  'lang.readingIn': 'Reading in',
  'lang.title': 'Language',
  'lang.choose': 'Choose your language',
  'lang.chooseHelp': 'Choose the language you read best.',
  'lang.change': 'Reading in {language}. Change language',

  // Phone home screen
  'home.welcome': 'Welcome',
  'card.aria': 'Prayer and help',
  'card.title': 'Need prayer or help?',
  'card.body': 'Write in your own language - a person reads every request.',
  'card.notNow': 'Not now',
  'card.write': 'Write a request',

  // Today's message
  'message.storedPassage': 'Stored passage, never written by AI',
  'message.demoPassage': 'Demo passage text. A church connects its licensed Bible translation before real use.',
  'crisis.line.it-emergency': 'Emergency (Italy)',
  'crisis.note.it-emergency': 'Police, ambulance, fire - free, 24/7',
  'crisis.line.it-violence': 'Anti-violence & stalking line',
  'crisis.note.it-violence': 'Free, 24/7, multilingual',
  'crisis.line.us-emergency': 'Emergency (USA)',
  'crisis.note.us-emergency': 'Police, ambulance, fire',
  'crisis.line.us-988': '988 Suicide & Crisis Lifeline',
  'crisis.note.us-988': 'Call or text, 24/7',
  'crisis.line.us-dv': 'National Domestic Violence Hotline',
  'crisis.note.us-dv': '24/7, many languages',
  'message.verseEnglishOnly': 'This passage is not yet stored in {language}, so it is shown in English. Koinonia never translates Bible text with AI.',
  'message.today': 'Today’s {term} · {language}',
  'message.preachedBy': 'Preached by {name}',
  'message.publishedBy': 'Published by {name}',
  'message.translatedNote': 'translated by AI with the church’s glossary, approved for publishing',
  'message.needsLiveAi': 'New notes published by {name} in English; {language} translation needs live AI.',
  'message.carry': 'To carry into your week',
  'message.askPrayer': 'Ask for prayer or join a group',
  'message.openPlan': 'Open the 7-day reading plan',

  // Reading aloud
  'listen.start': 'Listen',
  'listen.loading': 'Preparing the voice…',
  'listen.stop': 'Stop',
  'listen.browserVoice': 'Using this phone’s voice',

  // Service guide
  'service.firstTime': 'First time at {church}? You are welcome here.',
  'service.firstTimeBody':
    'Whether you are a student new to town, a visitor from another tradition, or coming back to church after years away, this guide explains what happens during the service and why.',
  'live.follow': 'Follow the service live',
  'live.now': 'Happening now',
  'service.order': 'Order of service',
  'service.part': 'Part {n} of {total} · {time}',
  'service.whatHappens': 'What happens now',
  'service.whyMatters': 'Why it matters',
  'service.posture': 'Posture and response',

  // Seven-day habit
  'habit.rubric': 'Seven days',
  'habit.title': 'Carry Sunday into the week',
  'habit.intro': 'A short reading, a question and a prayer for each day, from Sunday’s {term}.',
  'habit.progress': '{done} of 7 days done',
  'habit.day': 'Day {day}',
  'habit.dayDoneAria': 'Day {day}, done',
  'habit.dayShort': 'day',
  'habit.dayLabel': 'Day {day} · {label}',
  'habit.reflect': 'To reflect on',
  'habit.todo': 'Something to do',
  'habit.prayFor': 'Pray for',
  'habit.notes': 'My own notes',
  'habit.notesPrivate': 'Saved only in this browser, never sent anywhere',
  'habit.notesPlaceholder': 'Write a prayer or a thought for day {day}…',
  'habit.dayDone': 'Day {day} done',
  'habit.markDone': 'Mark day {day} done',

  // Prayer and care
  'care.rubric': 'Prayer and care',
  'care.title': 'Ask for prayer, help, or a group',
  'care.intro': 'Write in {language}. Personal details are removed on this phone, and you get a private code to read the reply.',
  'care.removedTag': 'Details removed on this phone',
  'care.yourRequest': 'Your request',
  'care.requestHelp': 'Write in any language. Names, phone numbers, emails, student IDs and addresses are removed before sending.',
  'care.placeholder': 'Share a prayer request, a need, or ask to join a group…',
  'care.leaves': 'What will leave this phone',
  'care.removed.one': '{n} detail removed',
  'care.removed.other': '{n} details removed',
  'care.removedSent.one': '{n} personal detail removed on this phone before sending',
  'care.removedSent.other': '{n} personal details removed on this phone before sending',
  'care.previewEmpty': 'Type above to see a preview.',
  'care.filterNote':
    'This filter looks for common formats and self-introductions (“My name is…”). It can miss things, so please don’t name other people.',
  'care.send': 'Send to the care team',
  'care.personReads': 'A person reads every request.',
  'care.sendError': 'Could not send. Please try again.',

  // Private reply code and reply page
  'code.title': 'Your private reply code',
  'code.help': 'Keep this code. Come back any time to read the reply from the care team - no phone number, email or account needed.',
  'code.enter': 'Enter your code',
  'code.openReply': 'Open my reply page',
  'pickup.waiting': 'The care team has not replied yet. A real person reads every request. Please check back after the service.',
  'pickup.replyFrom': 'Reply from',
  'pickup.check': 'Check for a reply',
  'pickup.codeAria': 'Pickup code',
  'pickup.onPhone': 'On this phone',
  'pickup.whatIWrote': 'What I wrote, saved only on this phone',
  'pickup.notFound': 'Not found',

  // Crisis panel (the crisis message itself lives in shared/crisis.ts)
  'crisis.callbackHelp': 'Optional: leave a phone number so a person from the care team can call you. It goes only to the care team, never to AI.',
  'crisis.callbackThanks': 'Thank you. Someone will call you.',
  'crisis.send': 'Send',
  'crisis.sendError': 'Could not send',

  // The church and its groups
  'church.leads': 'Leads the service',
  'church.careLead': 'Campus and care lead',
  'groups.title': 'Meet people during the week',
  'groups.langFirst': 'Groups that meet in {language} are listed first.',
  'groups.inLang': 'In {language}',
  'groups.when': 'When',
  'groups.where': 'Where',

  // Phone More screen
  'more.reading': 'Reading',
  'more.language': 'Language',
  'more.week': 'Your week',
  'more.replies': 'My replies',
  'more.church': 'This church',
  'more.howAi': 'How we use AI',
  'more.sample': 'Sample data',
  'more.machineNote': 'This page was translated automatically. If something reads wrongly, please tell a greeter.',
} as const;
