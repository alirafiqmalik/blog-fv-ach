# How research-paper blogs write headings

Fetched 27 September 2026, by requesting each URL and reading the HTML. JavaScript was not executed, so scroll, hover, and video playback are reported only when the markup or the page's own prose describes them.

Two genres showed up, plus one neighbor.

- **Named-attack project pages.** A proper noun, a one-paragraph threat, a mechanism, a demo, and a long FAQ. [Zombie Cards](https://khwarizmilab.github.io/emvexpiredcards/) is the closest sibling: one payment-system flaw, written as an explainer, with a paper behind it.
- **Distill articles.** Claim-shaped headings, a figure that carries part of the argument, and an appendix for credit and references. The journal is on hiatus; the pages still load.
- **Explorable explanations.** Adjacent. Play and models, not a paper page.

The ACH site already sits between the first two: scrollytelling figures, plus the section order of a payment-security explainer. The notes below are what those pages actually do with headings and prose.

## URLs that failed

| URL | Result |
| --- | --- |
| https://distill.pub/2020/circuits/attribution/ | HTTP 404. Title: "Page not found (404)". H2: "This page either doesn’t exist, or it moved somewhere else." |
| https://explorableexplanations.com/ | Timed out after 20 seconds. |
| http://explorableexplanations.com/ | Redirected to https://explorabl.es/, which did load. Treated as the reachable primary page and labeled adjacent below. |
| https://regreSSHion.com/ | Timed out after 25 seconds. |
| https://www.heartbeatbleed.com/ | DNS failure. https://heartbleed.com/ loaded and is used instead. |
| https://racoonattack.com/ | DNS failure (that spelling). https://raccoon-attack.com/ loaded. |
| https://blindsideattacks.github.io/ | HTTP 404. |
| https://khwarizmilab.github.io/digitalwallets/ and https://khwarizmilab.github.io/stolenwallets/ | HTTP 404. Guessed sibling paths. The lab index does not link another attack explainer. |

https://spectreattack.com/ returned the same document as https://meltdownattack.com/ (same title, same headings, same byte length). https://www.qualys.com/regresshion-cve-2024-6387/ loaded, and it is a vendor bulletin, so it is listed only to mark the boundary.

## Zombie Cards (primary example)

https://khwarizmilab.github.io/emvexpiredcards/

**Outline**

- H1: Zombie Cards Back Online
- H2: Reviving Expired Credit Cards for Contactless Payments
- H2: Abstract
- H2: Why Expired Cards?
- H2: What We Found
- H2: Demo Video
- H2: What We Tested
- H2: Press & Media Coverage
- H2: FAQ

FAQ questions are collapse toggles, not headings. The first seven:

- What is the "Zombie Card" attack, in one sentence?
- Is this a flaw in EMV's cryptography?
- How realistic is it for an attacker to obtain an expired card?
- Which cards and banks are affected?
- Does this affect Apple Pay or Google Pay?
- What factors most determine whether the attack succeeds?
- How is this different from prior EMV attacks?

Later toggles cover amount ($1, $100, $500), relay latency, what a cardholder should do, IRB, why the relay code is not released, notification of Visa and the banks, and CVE status.

**Heading style.** The H1 is a metaphor in title case. The subtitle H2 is a gerund that says the mechanism: reviving expired cards for contactless payments. Later H2s are short reader questions ("Why Expired Cards?") or noun phrases that name a result ("What We Found", "What We Tested"). They are title case, mostly under six words, and they are not paper section names like Methods or Evaluation. The FAQ questions are full sentences, including the skeptical ones.

**Section order.** Claim, then abstract, then the ordinary expectation, then the mechanism, then a video, then the test scope, then press, then FAQ. Disclosure, ethics, and "why no exploit code" live in the FAQ, not in their own sections. There is no separate "impact" heading. Impact is the $100 demo line and the FAQ answers about which configurations paid.

**Voice.** "We" for the study. "You" appears when the FAQ addresses a cardholder ("You do not need to change how you use contactless payments."). Sentences are short. The abstract asks the question the reader already has: "Most people reasonably assume that an expired card has become useless. Our research asks a simple question: is that always true?" Jargon arrives after the plain version. "Relay" is defined as something that "sits between the card and checkout terminal and changes the expiry value the terminal reads" before Relay Resistance Protocol is named.

Inside "Why Expired Cards?" a labeled span says "The short version:" and then one sentence about the terminal and the bank seeing expiry in different places.

**How the attack is named.** One attack, one name, introduced after the mechanism: "This is why we call it a Zombie Card: the card is supposed to be retired, yet it can appear alive to part of the payment system." The next sentences limit it: it does not mean every expired card works, and it does not mean an ordinary cardholder is expected to defend against the attack. The mechanism is a five-step numbered list, one shared template, not tabs and not a section per variant.

**Numbers, quotes, screenshots.** The demo caption carries the number: "an expired Visa card completing a $100 contactless transaction at a real POS terminal." The $1 / $100 / $500 range is in the FAQ, under a question about whether amount matters. Two photos sit in the body. The first, under the finding, has alt text "Theoretical attack setup: POS terminals, NFC relay over smartphones, and victim card". The second, under "What We Tested", has alt text "Experimental setup: SumUp terminals, CardEmulator phone, POSEmulator phone, and victim card". The prose states the result; the photo shows the rig. Banks are "Banks A–E". The susceptible case is named (Visa contactless); Mastercard, American Express, and Discover are named as the configurations that rejected the change.

**What keeps it from hype.** Scope is in the same paragraph as the finding. The FAQ answers "Is this a flaw in EMV's cryptography?" with "Not in the usual sense. We did not break the card's keys." Press logos are a strip at the bottom, after the argument.

**Interaction.** A YouTube embed (`youtube.com/embed/4lSSENmAXsg`) under "Demo Video". FAQ panels use Bootstrap collapse. No scroll-scrub or sticky-figure markup in the HTML. The five-step list is the explanation a reader gets without playing the video.

The lab home page (https://khwarizmilab.github.io/) links this explainer as "Expired Card Attack" and no other project page of the same kind. https://khwarizmilab.github.io/research/ describes areas (system security policies, quantum security, mobile networks) and points at the publications list. It is not an explainer.

## Distill

### Author guide

https://distill.pub/guide/

This page is a framework manual, "How to Create a Distill Article", with the deck "A collection of examples and best practices for creating interactive explanatory articles using the Distill web framework." It is not a prose style guide. The writing advice that does exist is about where figures sit.

**Outline.** H1: How to Create a Distill Article. H2s: Getting Started, Markdown, Project Structure, Front Matter, Citations, Footnotes, Code Blocks, Equations, Diagrams, Layouts, Appendix, And You’re Off, Including External Files.

Diagrams: static figures in a vector tool; dynamic figures in D3, including the pattern of drawing a static diagram and then animating tagged pieces. Layouts name a body column, wider figures (`.l-middle`, `.l-page`), full-bleed (`.l-screen`), side floats, and a gutter "for marginalia, asides, and footnotes" that "does not interrupt the normal flow" except on small screens. The appendix template asks for Acknowledgments and an Author Contributions statement.

The sample article skeleton uses an H1 ("Hello World") and an H2 that is "A description of the article", then byline, then paragraphs. Headings in the guide itself are title-case nouns.

### About page (the style argument)

https://distill.pub/about/

**Outline**

- H2: Distill was a scientific journal which operated 2016-2021.
- H2: A modern medium for presenting research
- H2: New ways of thinking enable new discoveries
- H2: Machine learning needs more transparency
- H2: Legitimacy for non-traditional research artifacts
- H2: Clear writing benefits everyone
- H2: The people behind Distill

The H2s are claims. "Clear writing benefits everyone" says: "When we rush papers out the door to meet conference deadlines, something suffers — often it is the readability and clarity of our communication. This can add severe drag to the entire community as our readers struggle to understand our ideas. We think this research debt can be avoided."

Interaction is described in the prose, and this fetch did not run it. "Hover over this diagram to see how a neural turing machine shifts its attention." A t-SNE "interactive playground" and an "inspectable RNN handwriting model" are named the same way: the widget exists so the reader can see the step the sentence just introduced.

### Research Debt

https://distill.pub/2017/research-debt/. Chris Olah and Shan Carter, 22 March 2017.

**Outline**

- H1: Research Debt
- H2: The Debt
- H2: Interpretive Labor
- H2: Clear Thinking
- H2: Research Distillation
- H2: Where are the Distillers?
- H2: An Ecosystem for Distillation
- H2: Further Reading
- H3 appendix: Acknowledgments, Author Contributions, References, Updates and Corrections, Reuse, Citation

**Heading style.** Title case. Short noun phrases that name the idea ("The Debt", "Interpretive Labor", "Clear Thinking", "Research Distillation"). One question: "Where are the Distillers?" Headings are claims about the field, not topics. Length is two or three words until the question.

**Voice.** First person plural, long paragraphs, one metaphor held for a section (the mountain of prior work, then "The climb isn’t progress: the climb is a mountain of debt."). "Clear Thinking" states the standard this genre is aiming at: "Developing good abstractions, notations, visualizations, and so forth, is improving the user interfaces for ideas. [...] if we can’t explain an idea well, that’s often a sign that we don’t understand it as well as we could." "Research Distillation" says a good explanation often transforms the idea, and that this "can take just as much effort and deep understanding as the initial discovery."

Further Reading points at explorable explanations, Bret Victor, and visual mathematics. That is the bridge to the adjacent genre. No attack narrative, no FAQ, no screenshots of evidence. The figures are illustrations of the debt metaphor. I did not see a scroll-driven scene described.

### The Building Blocks of Interpretability

https://distill.pub/2018/building-blocks/

**Outline**

- H1: The Building Blocks of Interpretability
- Deck, in the HTML as the line under the title: Developing a Grammar of Interfaces for Understanding Neural Networks
- H2: Making Sense of Hidden Layers
- H2: What Does the Network See?
- H2: How Are Concepts Assembled?
  - H3: Spatial Attribution with Saliency Maps
  - H3: Channel Attribution
- H2: Making Things Human-Scale
- H2: The Space of Interpretability Interfaces
- H2: How Trustworthy Are These Interfaces?
- H2: Conclusion & Future Work
- H3 appendix: Acknowledgments, Author Contributions, Discussion and Review, References, Updates and Corrections, Reuse, Citation

**Heading style.** Title case. H2s alternate a noun phrase ("Making Sense of Hidden Layers") with a question the section answers ("What Does the Network See?", "How Are Concepts Assembled?", "How Trustworthy Are These Interfaces?"). H3s name the technique. The trust section is part of the argument, not a footnote. Questions are real section titles, not a terminal FAQ.

The opening sentence under the title is the whole method: "Interpretability techniques are normally studied in isolation." The next prose paragraph says the work has to "construct deep abstractions and reify (or instantiate) them in rich interfaces."

The fetched HTML has the article text and the appendix. It has no `<video>`, no `<canvas>`, and no `dt-` elements. Hover and sticky strings appear in the file; I did not execute the page, so I cannot describe which figures move. The About page is the place that states the intended gesture (hover a diagram to see the next step).

### Zoom In: An Introduction to Circuits

https://distill.pub/2020/circuits/zoom-in/ (used because the attribution URL 404'd). Thread index: https://distill.pub/2020/circuits/

**Outline (body headings)**

- H1: Zoom In: An Introduction to Circuits
- H2: Introduction
- H2: Three Speculative Claims
  - H4: Schwann’s Claims about Cells
  - H4: Three Speculative Claims about Neural Networks
- H2: Claim 1: Features
  - H3: Example 1: Curve Detectors
  - H4: Argument 1 through Argument 7, each named (Feature Visualization, Dataset Examples, Synthetic Examples, Joint Tuning, Feature implementation, Feature use, Handwritten Circuits)
  - H3: Example 2: High-Low Frequency Detectors
  - H3: Example 3: Pose-Invariant Dog Head Detector
  - H3: Polysemantic Neurons
- H2: Claim 2: Circuits
  - H3: Circuit 1: Curve Detectors
  - H3: Circuit 2: Oriented Dog Head Detection
  - H3: Circuit 3: Cars in Superposition
  - H3: Circuit Motifs
- H2: Claim 3: Universality
- H2: Interpretability as a Natural Science
- H2: Closing Thoughts
- H3: Glossary, then the usual appendix

**Heading style.** The H2 is the claim, numbered: "Claim 1: Features". Examples and arguments are numbered too, so a reader can see that six arguments support one example. Title case. Headings are noun phrases that say what was found ("Curve Detectors", "Cars in Superposition"), not "Experiment 2".

The introduction is a chain of questions in the prose, after an analogy (microscopes, cells): "What if we instead take an approach inspired by neuroscience or cellular biology — an approach of zooming in?" The claims are explicitly allowed to be wrong; the essay says Schwann’s third claim "turned out to be horribly wrong" and still treats a strong claim as useful.

Same limit as Building Blocks: the HTML is the essay. I did not run the figures. The thread index (https://distill.pub/2020/circuits/) is a list of article titles ("Zoom In", "Curve Detectors", "Curve Circuits", "Weight Banding"), each a noun phrase, under H2 "Articles & Comments" and H2 "About the Thread Format".

## Security project pages

These are the same genre as each other: a logo, a name, a paper button, a short mechanism, sometimes a video, then questions a worried reader would type. They are lighter on narrative than Zombie Cards and lighter on figures than Distill. https://meltdownattack.com/ and https://downfall.page/ and https://ghostwriteattack.com/ are the three read closely. The rest are shorter notes from the same fetch.

### Meltdown and Spectre

https://meltdownattack.com/ (https://spectreattack.com/ is the same page)

**Outline**

- H1: Meltdown and Spectre
- H4: Meltdown
- H4: Spectre
- H2: Who reported Meltdown?
- H2: Who reported Spectre?
- H2: Questions & Answers
  - H4s, all questions: Am I affected by the vulnerability? Can I detect if someone has exploited Meltdown or Spectre against me? Can my antivirus detect or block this attack? What can be leaked? Has Meltdown or Spectre been abused in the wild? Is there a workaround/fix? Which systems are affected by Meltdown? Which systems are affected by Spectre? Which cloud providers are affected by Meltdown? What is the difference between Meltdown and Spectre? Why is it called Meltdown? Why is it called Spectre? Is there more technical information about Meltdown and Spectre? then CVE questions, a demo question, a logo question, a proof-of-concept question, and a pointer to vendor advisories.
- H2: Acknowledgements

**Heading style.** The H1 is the two names. H2s are questions ("Who reported Meltdown?") or the label "Questions & Answers". FAQ items are full questions, title case, and they are the body of the page. "Why is it called Meltdown?" is a genre habit: the name gets its own question. Answer on the page: "The vulnerability basically melts security boundaries which are normally enforced by the hardware." Spectre: "The name is based on the root cause, speculative execution. As it is not easy to fix, it will haunt us for quite some time."

**Order.** One-sentence banner ("Vulnerabilities in modern computers leak passwords and sensitive data."), then a paragraph of what leaks, then two parallel blurbs, then attribution, then the FAQ. No methods section. The papers are links under each blurb.

**Voice.** "You" and "your passwords" in the opening. "We" for what was tested ("We successfully tested Meltdown on Intel processor generations released as early as 2011."). Answers are short, including "We don't know." on abuse in the wild and "Most certainly, yes." on whether the reader is affected.

**How attacks are named.** Two attacks, one shared shape. Each blurb says which isolation breaks, who is exposed, and where the paper is. The difference is one FAQ answer: Meltdown "breaks the mechanism that keeps applications from accessing arbitrary system memory." Spectre "tricks other applications into accessing arbitrary locations in their memory."

**Figures and motion.** No video or canvas in the fetched HTML. The FAQ asks "Can I see Meltdown in action?" The extracted outline has that question and no embedded player. I cannot describe a running demo.

### Downfall

https://downfall.page/

**Outline**

- H1: Downfall Attacks
- H2: Demo
  - H3: Stealing 128-bit and 256-bit AES keys from another user
  - H3: Stealing arbitrary data from the Linux Kernel
  - H3: Spying on printable characters
- H2: FAQ
- H2: Advisories
- H2: Links

The FAQ is marked `[Q]` / `[A]` in the text, not as headings. Questions include "Am I affected by this vulnerability?", "How practical are these attacks?", "Why is this called Downfall?", and "Can I play with Downfall?"

**Heading style.** H1 is the name plus "Attacks". Demo H3s are gerunds that name the stolen thing, not the technique. Gather Data Sampling and Gather Value Injection appear in the intro paragraph, not as section titles. "Why is this called Downfall?" answers: it "defeats fundamental security boundaries" and follows Meltdown and Fallout.

**Voice.** First person singular. "I discovered that the Gather instruction [...] leaks the content of the internal vector register file." "It tooks me 2 weeks to develop an end-to-end attack" (spelled that way on the page). "You can read the paper I wrote about this for more detail."

**Numbers and evidence.** CVE-2022-40982, "billions of modern processors", "at least nine years", "up to 50% overhead", "Almost one year" of embargo, reported "August 24, 2022". The numbers sit in FAQ answers. Each demo H3 is a video element ("Your browser does not support the video tag."). I did not play them. Advisories are a vendor/link table after the FAQ. Press headlines are a list under Links, the same job as Zombie Cards' logo strip.

### GhostWrite

https://ghostwriteattack.com/

**Outline**

- H1: GhostWrite
- H2: Fundamentals.
  - H3: Process Isolation and Assembly Instructions.
- H2: RISC-V.
  - H3: A New CPU Architecture.
- H2: GhostWrite.
  - H3: Writing Arbitrary Physical Memory.
- H2: Demo
- H2: Security Implications
- H2: RISCover.
  - H3: Differential CPU Fuzz Testing.
- H2: Who found it?
- H2: Acknowledgements
- H2: FAQ

FAQ items are `<summary>` questions, including "Am I affected by this vulnerability?", "Can software updates or patches fix this vulnerability?", "Is this a side-channel or transient-execution attack?", "Does this mean that RISC-V is bad?", and "Can I use the logo?"

**Heading style.** Several H2s end with a period ("Fundamentals.", "RISC-V.", "GhostWrite.", "RISCover."). That punctuation is peculiar to this page. H3s are noun phrases that teach one idea. The order is the useful part: ordinary mechanism, then the architecture, then the bug, then the demo, then who is affected, then how it was found, then people, then FAQ.

**Voice.** "You" for the machine in front of the reader ("Your computer runs programs by executing instructions on the CPU."). "We" for the discovery ("We discovered GhostWrite by analyzing both documented and undocumented instructions"). Terms get a sentence of definition before the attack: virtual memory, then ISA, then the vector extension, then the bug.

**How the attack is introduced.** One name. The H3 under it is the effect: "Writing Arbitrary Physical Memory." A second named object, RISCover, is the method, and it gets its own section after the implications, so the fuzzer does not compete with the bug. The demo is two exploits, each with a paragraph and a video caption. I did not play the videos. The captions say what the clip shows (patching `getuid`, then reading a password out of physical memory).

**Limits next to the claim.** "The attack is 100% reliable, deterministic, and takes only microseconds to execute" is in the mechanism section. The FAQ then says "Most likely, you are not affected directly" and names the two CPUs. "Does this mean that RISC-V is bad?" is answered by separating the ISA from the T-Head implementations. CVE-2024-44067, a device list, and "up to 33% overhead" sit in Security Implications and the FAQ.

### Shorter notes from the same kind of page

**Heartbleed.** https://heartbleed.com/

- H1: The Heartbleed Bug
- H3: What leaks in practice?
- H3: How to stop the leak?
- H3: Q&A
- H4s are questions: What is the CVE-2014-0160? Why it is called the Heartbleed Bug? What makes the Heartbleed Bug unique? Is this a design flaw in SSL/TLS protocol specification? then a run of "what is leaked" and "am I affected" questions.

The page is a Q&A. Two H3s do the explanatory work ("What leaks in practice?", "How to stop the leak?") and everything else is a question. Same habits as Meltdown: a why-the-name question, a CVE question, an "am I affected" question, an "abused in the wild" question.

**Raccoon.** https://raccoon-attack.com/

- H1: Raccoon Attack
- H2: Attack Overview
- H2: Full Technical Paper (last update: 11.2.2021)
- H2: FAQ
- H3s are the questions, including "I am an admin, should I drop everything and fix this?", "So how practical is the attack?", "Why is the attack called "Raccoon"?", and "Is this vulnerability really serious enough to deserve a name, a logo and a web page?"

The overview is the densest mechanism of this set. It defines Diffie-Hellman, the premaster secret, and the leading-zero strip, then says what the attacker can learn. The FAQ is where the tone turns. "Probably not" is the whole first answer to dropping everything. "Raccoons are just cute animals, and it is well past time that an attack will be named after them" is the name answer. The seriousness question is answered "It is a vulnerability in the TLS specification, so we think...yes." A measurement sits in the FAQ: "3.33% of those servers reused their ephemeral DH keys at least once" across the Alexa Top 100k. No video in the HTML. Two "details" matches; I did not see a scroll scene.

**Hertzbleed.** https://www.hertzbleed.com/

- H1: Hertzbleed Attack
- H2: Research Papers
- H2: Questions and Answers
- H3s are questions: Am I affected by Hertzbleed? What is the impact of Hertzbleed? Should I be worried? Is Hertzbleed a bug? plus disclosure timing, microcode, workarounds, and "Did we really need another vulnerability logo?"

The lead, before any H2, is the definition: "Hertzbleed is a new family of side-channel attacks: frequency side channels." The concrete example is in that lead, not in a figure: the same program can take a different wall time for `2022 + 23823` and `2022 + 24436`. Updates are flagged lines at the top ("Update:"), not new H2s. "Constant time" is in quotation marks when they say the SIKE implementation was still extracted. Iframes are in the HTML (3). No video tag. I did not see the papers render.

**PLATYPUS.** https://platypusattack.com/

- H1: PLATYPUS
- H2: With Great Power comes Great Leakage
- H1: PLATYPUS in Action
  - H3: The Power Meter within the CPU. Intel RAPL.
  - H3: PLATYPUS. Finding Secrets in the Dark.
  - H3: Protecting against PLATYPUS. Fixing RAPL.
- H1: Who is behind PLATYPUS?
- H1: Questions & Answers

Headings are two beats: a plain description, then the proper noun ("The Power Meter within the CPU. Intel RAPL."). The analogy is in the prose under the second H3: a platypus senses prey in the dark; the attack reads secrets from energy measurements. Mitigation is its own H3, with the action in the heading ("Fixing RAPL."). Four iframes. I found no `<video>` tag and no description of a scroll-scrubbed figure. The word "scroll" did not survive a second look at contexts I could quote, so I am not calling this a scrollytelling page.

**Zenbleed.** https://lock.cmpxchg8b.com/zenbleed.html

- H1: Zenbleed
- H2: Introduction, Vulnerability, Exploitation, Discovery, Solution, Conclusion
- H4s under those: Zeroing Registers, The Vector Register File, Speculation, Optimization, Feedback, Oracle, Oracle Serialization, Workaround, Detection, Acknowledgements
- H5s under Workaround: Linux, FreeBSD, Others

This is the outlier. Headings are paper sections. The hook is the first sentence, not the H1: "If you remove the first word from the string 'hello world', what should the result be? This is the story of how we discovered that the answer could be your root password!" Mechanism is taught with a real `strlen` disassembly in the introduction, before the vulnerability section. That is a blog post that happens to document a CVE, closer to a lab notebook than to Meltdown's FAQ wall.

**GoFetch.** https://gofetch.fail/

- H1: GoFetch
- H3: Breaking Constant-Time Cryptographic Implementations Using Data Memory-Dependent Prefetchers
- H4: Overview of GoFetch Attack
- H4: Demo Videos. / H5: Go's RSA-2048 Key Extraction on Apple m1
- H4: People Behind GoFetch
- H4: Frequently Asked Questions
- H2s are the FAQ itself: What is the mechanism behind GoFetch? What processors have DMPs and are affected by GoFetch? What is the difference between GoFetch and Augury? What is a Cache Side-Channel Attack? What is constant-time programming? What is a data memory-dependent prefetcher? then disable, protect, proof-of-concept, logo, and "When did you notify Apple?"

The subtitle H3 is the paper title. The mechanism is an FAQ question promoted to H2, so a reader who skips the FAQ skips the explanation. Demo is a named video of one key extraction. Useful as a warning about heading rank: a question that carries the mechanism should not be buried at the same level as "Can I use the logo?"

**Inception.** https://comsec.ethz.ch/research/microarch/inception/

- H1: Inception: how a simple XOR can cause a Microarchitectural Stack Overflow
- H2: Inception
- H2: Training in Transient Execution (TTE)
- H2: Phantom speculation
- H2: Inception: A Combination of TTE and Phantom
- H2: Mitigations
- H2: Resources
- H2: FAQ

The H1 is a sentence: a small instruction, a large effect. Two phenomena get their own H2s before the combination is named again. The FAQ is short and practical ("Is my machine affected?", "What should I do?"). Overhead numbers are in Mitigations: "between 93.1% and 216.9%" for a full flush on Zen 1 and Zen 2. The page says "You can see a demo of Inception" in the lead. I did not watch it.

**Retbleed.** https://comsec.ethz.ch/research/microarch/retbleed/

- H1: Retbleed: Arbitrary Speculative Code Execution with Return Instructions
- H2: Microarchitectural conditions to exploit Retbleed
- H2: Phantom JMPs
- H2: Affected machines
- H2: Mitigations
- H2: Demo
- H2: Resources
- H2: FAQ

Same ETH Zurich template as Inception: name plus a technical subtitle, conditions, a sibling bug, affected machines, mitigations with overhead ("between 14% and 39%"), a demo section, resources, FAQ. The FAQ includes "Should I worry?" The H1 is a claim about return instructions, not the word Retbleed alone.

**Augury.** https://www.prefetchers.info/

- Several H1s: Augury, UPDATE (March 26 2024), Old content below, Who found this?, FAQ
- H2s are FAQ questions: What processors are affected? How bad is this? What exactly is a DMP? What makes Augury different from Spectre/MDS/etc? Why "Augury"? Is Apple patching anything?

"How bad is this?" as an H2 is the blunt version of Raccoon's practicality question. The March 2024 update is an H1 stacked above the old page, the same idea as Hertzbleed's update banners, with worse heading hierarchy.

### Not this genre

https://www.qualys.com/regresshion-cve-2024-6387/ is a Qualys product page. H1: "The regreSSHion Bug". H2: "An Unauthenticated Remote Code Execution (RCE) vulnerability in OpenSSH's server (sshd) on glibc-based Linux systems." H3s: What is regreSShion? regreSSHion background. Why was it named regreSSHion? About OpenSSH? Affected OpenSSH versions. Then "regreSSHion Resources". The why-the-name question is the same habit, and the page is a vendor writeup. It is not a research explainer.

## Adjacent: explorable explanations

https://explorableexplanations.com/ timed out. http://explorableexplanations.com/ redirected to https://explorabl.es/, which loaded.

That page is a hub, not an essay. Visible lines: "Welcome to Explorable Explanations, a hub for learning through play! We’re a disorganized “movement” of artists, coders & educators who want to reunite play and learning." It calls itself "above all, an experiment." There is no H2 outline of an argument. The page says it needs JavaScript to "dynamically load shtuff." I did not execute that, so I did not see the listed explorables.

Nicky Case's 8 September 2014 post, https://blog.ncase.me/explorable-explanations/, is a primary page by the same person. It is workshop notes. The hub is the page above. It is still adjacent. Patterns named on that page, in the author's words:

- "Use interactivity only when interactivity works best, otherwise, supplement it with text & images."
- A hook "provides an overview, motivates the explorer, but doesn't require a lot of upfront knowledge."
- The ending "should make use of the knowledge the explorer's learnt throughout the explanation."
- Teach mechanics in isolation, then combine them (the jumping / walking / pushing-blocks ladder).
- "Let the explorer create their own data points, and form their own model."
- "Remember to test your explanation with people."

Distill's Research Debt "Further Reading" links this tradition (Bret Victor's explorable explanations, and examples). It is a different contract: the reader operates a model. The attack pages and the ACH explainer ask the reader to follow a case.

## What repeats

**Headings are claims or questions, and they are short.** Zombie Cards: "What We Found", "Why Expired Cards?". Distill: "Claim 1: Features", "What Does the Network See?", "The Debt". Inception's H1 is a full clause about a XOR. The paper-shaped outline (Introduction, Vulnerability, Exploitation) shows up on Zenbleed and almost nowhere else in this set.

**Case.** Distill, Zombie Cards, and the FAQ pages use title case. The ACH page already uses sentence case ("How an ACH payment actually moves", "What we tested"). That break is reasonable. Copy the job of the heading. The capitals can stay as they are.

**One proper noun, then a gloss.** Zombie Card, Downfall, GhostWrite, Hertzbleed, Raccoon. The gloss is a subtitle (Zombie Cards' gerund H2, GoFetch's paper-title H3, Inception's XOR clause) or a sentence immediately after the name. "Why is it called X?" is optional FAQ furniture. The gloss still belongs in the subtitle or the next sentence.

**Several instances share a template.** Meltdown and Spectre are two blurbs with the same slots. Downfall's three videos share a gerund heading. Zoom In numbers Claim, Example, and Argument. Zombie Cards uses one five-step list because there is one attack. Nobody in this set uses tabs.

**Order on the security explainers.** Expectation or threat, mechanism in plain words, demo, who was actually affected (including who was not), what changed or what to patch, then questions. Zombie Cards puts press and FAQ last. Distill puts trust and limits in the body ("How Trustworthy Are These Interfaces?", Schwann's wrong claim) and puts credit in an appendix.

**Voice.** "We" for experiments. "You" when the reader holds the device or the account (GhostWrite's fundamentals, Meltdown's opening, Zombie Cards' cardholder FAQ, the ACH pipeline section that already says "You, the originator"). Downfall's "I" fits a single author writing up a personal demo. A multi-author paper page stays with "we". The first sentence is the plain action. The acronym comes next.

**Numbers sit on the sentence they measure.** $100 in the Zombie Cards demo line. 3.33% in the Raccoon FAQ. 50% gather overhead in the Downfall FAQ. 14% to 39% in the Retbleed mitigations section. Hertzbleed's `2022 + 23823` example is in the lead, because the example *is* the mechanism.

**Screenshots and video are evidence, with a caption that states the outcome.** Zombie Cards' alts describe the rig. Downfall's H3s name the stolen object. GhostWrite's demo paragraphs say what each clip does. Distill's guide wants a figure beside the sentence (side float, gutter) so the column of prose continues.

**Hype control is a sentence that bounds the claim.** Zombie Cards: not every expired card, and not a broken cryptosystem "in the usual sense." Raccoon: "Probably not." GhostWrite: probably not your laptop, and not a RISC-V indictment. Meltdown: "We don't know." Hertzbleed puts "constant time" in quotes when describing the SIKE implementation that was still extracted.

**Motion I could actually confirm.** Zombie Cards: a YouTube embed and click-to-open FAQ. Downfall, GhostWrite, GoFetch, and the Retbleed/Inception pages: video sections described in the HTML or the prose; I did not press play. Distill's About page tells the reader to hover a diagram. I did not find a sticky scroll-scrubbed scene on any of these URLs. The scrollytelling on the ACH site is closer to Distill's "figure carries a step" than to anything on meltdownattack.com. The no-JS fallback those attack pages rely on is a numbered list or a FAQ answer that still states the result.

## What to apply to Credit Without Debit

Current H2/H3 sequence in `academic-project-astro-template/src/paper.mdx`:

- Abstract
- Nacha, ACH, and a banking payment
- How an ACH payment actually moves
  - (prose, then the pipeline)
- From the rules to a machine
  - Five machines, two channels
  - Three things that should always be true
- Credit-Without-Debit
  - A1 — creditBLEED
  - A2 — creditMINT
  - A3 — creditRESET
- What we tested
- We reported it, and the instances closed
- What would have to change
- The short version
- Questions
- Artifact
- Ethics
- Cite this work

`docs/storyboard.md` already asks for short declarative sentences, one idea per scroll step, concrete numbers, and second person only when the reader holds the account. The pages above support that. The changes below are about headings and where a sentence sits.

**Open on the broken expectation, and keep Abstract as a block under it.** Zombie Cards' H1 is the metaphor; the abstract is an H2 the reader can skip. The first prose question is whether an expired card is useless. "Abstract" as the first heading is the paper outline, which this set mostly abandoned. The sentence already in the pipeline caption (the other side lights up while the debit has not happened) is the H1-scale claim. A two-sentence "short version" belongs there too. Zombie Cards puts "The short version:" inside "Why Expired Cards?", early. The recap at the bottom can stay.

**Keep the headings that already act like claims.** "How an ACH payment actually moves", "Three things that should always be true", "What we tested", "We reported it, and the instances closed", and "What would have to change" match Zombie Cards ("What We Found", "What We Tested") and GhostWrite ("Security Implications", then the fix). Leave them.

**Rename the topic labels so the heading is the point.** "Nacha, ACH, and a banking payment" names the cast. The cast is the paragraph; the heading should be the fact a reader is about to use, in the manner of "Why Expired Cards?" or "Claim 1: Features". A sentence-case question works: "Why does this payment take days?" "From the rules to a machine" names a process. The claim in that section is that the rules permit more than one behavior and the checker tries all of them. A heading closer to Zoom In would say that.

**Give each attack a gloss in the heading, and keep one template.** "A1 — creditBLEED" is a codename. Downfall's demo headings say what was taken. Platypus splits a heading into a plain beat and a name ("The Power Meter within the CPU. Intel RAPL."). Pair the codename with the broken assumption the table already states, for example "creditBLEED: the credit posts before the other bank is asked." Same grammar for creditMINT and creditRESET. Keep the comparison table. Meltdown/Spectre and Zoom In's Argument 1..7 are the precedent for one shape repeated three times. The root-cause / permissive-rule / figure pattern under each H3 is that shape. Use it for all three. Tabs do not appear on any page in this set.

**Put the bound in the attack section.** Ethics can repeat it. Zombie Cards says "it does not mean every expired card works" in "What We Found", then repeats the negative results in "What We Tested" (Mastercard, American Express, Discover rejected the change). GhostWrite's "you are not affected directly" is a FAQ, and the CPU list is in the implications section. "No third-party account was affected" and "eight institutions is a small sample" should stay beside "What we tested". Ethics can repeat them. Raccoon's first FAQ answer ("Probably not") is the tone for a question like "Should I close my account?"

**"Questions" should be the questions.** On Meltdown, Raccoon, Hertzbleed, GhostWrite, and Zombie Cards, the heading is the question a reader would type, including the awkward ones: practicality, whether this is a broken cryptosystem, whether a normal customer must do anything, why exploit code is or is not released, whether a CVE exists. "Questions" as a single H2 hides that. GoFetch shows the failure mode to avoid: the mechanism itself is an H2 inside the FAQ, at the same rank as "Can I use the logo?" Keep the mechanism in the body. Use the FAQ for scope, disclosure status, and what a customer does.

**Voice, sentence by sentence.** Mechanism sections may say "you" for the originator, which GhostWrite and the current pipeline section both do. Model checking, disclosure, and the test writeup stay in "we", which is Zombie Cards' split. Define the plain action before the acronym (relay before Relay Resistance Protocol; "your bank" before ODFI, which the page already does). One number per claim: 30.7 billion and 20 billion stay on the institutions sentence; return codes and day counts stay on the attack they measure. Hertzbleed is the model for a single numeric toy in the lead only when the toy is the mechanism. A volume statistic is not that toy.

**Figures.** Caption the outcome, the way Downfall's H3s and Zombie Cards' demo line do. The Nacha quotation is already in a highlighted block with the article number under it. That matches Distill's gutter idea: the quote sits beside the sentence as evidence, and the heading stays the claim. Distill's About page is the interaction rule worth copying, and it is the one this set states outright: hover or scrub should reveal the step the sentence just named. I did not find that pattern on the attack-advisory pages; they use a video whose title is the outcome, plus a list that still makes sense if the video never plays. The five-step list on Zombie Cards is the right model for the narrow-viewport caption list. Each sticky scene's last frame has to carry the claim on its own, because a reader who never scrubs is the common case on every page fetched here.

**Density.** Zombie Cards is a few short sections, two photos, one video, then press and FAQ. Distill is long, with the figure sharing the column. The ACH page has a model and three instances, so it will be longer than Zombie Cards. Inside each instance, match Zombie Cards' local rhythm: a short paragraph, the shared slots, one figure, one rule sentence. Leave BibTeX, the artifact, and the ethics restatement after the story, where Zombie Cards leaves press and where Distill leaves the appendix.

**Leave GhostWrite's trailing periods and Distill's title case.** The period-terminated H2s are a one-site tic. Title case is the journal and the FAQ-page habit. Sentence case already matches the narration spec and reads as speech. The heading still has to be a claim or a question.
