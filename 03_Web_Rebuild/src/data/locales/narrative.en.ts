import type { GameEventPayload } from '../../types/narrative';

type NarrativeLine = {
  speakerName?: string;
  speakerTitle?: string;
  content: string;
};

type NarrativeTranslation = {
  title: string;
  name?: string;
  dialogue: NarrativeLine[];
  choices?: string[];
};

/**
 * Original game prose. Canonical Three-Body proper nouns use the published
 * English forms (for example: Sophon, Wallfacer, Dark Forest, and Swordholder).
 * This deliberately contains no prose from the novels.
 */
export const englishNarratives: Record<string, NarrativeTranslation> = {
  random_tech_inspiration: {
    title: 'A Flash of Insight',
    name: 'A Flash of Insight',
    dialogue: [{
      speakerName: 'Ding Yi',
      content: 'We have found an anomaly in the high-energy experiments. The sophon blockade still holds at the macroscopic scale, but the disturbance in the microphysics may have opened a new line of inquiry.',
    }],
  },
  random_resource_scandal: {
    title: 'The Resource-Smuggling Scandal',
    name: 'The Resource-Smuggling Scandal',
    dialogue: [{
      speakerName: 'Evans',
      content: 'The Lord has no use for your laws. These resources belonged to the Lord from the beginning. We are merely returning them.',
    }],
  },
  random_wallfacer_proposal: {
    title: 'A Wallfacer Proposal',
    name: 'A Wallfacer Proposal',
    dialogue: [
      {
        speakerName: 'Manuel Rey Diaz',
        content: 'This is part of my plan. By routing the world’s resources along nonlinear paths, we may keep the true design beyond the sophons’ sight.',
      },
      {
        speakerName: 'Shi Qiang',
        content: 'I do not understand a word of it. Still, it sounds fierce. Let’s do it.',
      },
    ],
  },
  tech_vacuum_decay_incident: {
    title: 'Maximum Alert: Vacuum-Decay Bubble',
    dialogue: [
      {
        speakerName: 'System Notice',
        content: 'An anomalous curvature has been detected at the solar-orbit accelerator’s collision point. The energy level exceeds the theoretical limit by fourteen orders of magnitude. A micro-vacuum bubble is forming and may convert the surrounding space to a new ground state at light speed.',
      },
      {
        speakerName: 'Chief Physicist Li',
        content: 'Governor, we opened something that should have remained closed. If the bubble expands, the Solar System will be erased in 0.3 seconds. We can pour every reserve into a containment field, but the experiment and the orbital laboratory will both be lost.',
      },
      {
        speakerName: 'Chang Weisi',
        content: 'There is another way. We can try to annihilate it with a reverse pulse. The chance is under fifteen percent, but success would put the universe’s underlying rules in our hands. Those who refuse to risk anything do not deserve to survive.',
      },
    ],
    choices: [
      'Evacuate at once and abandon the orbital laboratory. Use the station’s mass to build a containment barrier. (Heavy economic and research losses.)',
      'Attempt Wade’s reverse-annihilation plan. Fifteen percent is enough. (High chance of a catastrophic chain reaction.)',
    ],
  },
  revolt_eto_engine_sabotage: {
    title: 'Red Alert: Planetary-Engine Nodes Compromised',
    dialogue: [
      {
        speakerName: 'System Warning',
        content: 'Tokyo Engine Three has deviated 0.7 degrees from its thrust vector. The control matrix contains an unauthorized low-level command injection. Tracing source… confirmed: a quantum virus from Azure, an extremist ETO cell.',
      },
      {
        speakerName: 'PDC Security Director',
        content: 'They hold at least twelve engine nodes and are trying to steer Earth into a Kuiper Belt gravity trap. We have found their command room, but it is surrounded by civilian housing. A forced entry will cause severe collateral casualties.',
      },
      {
        speakerName: 'Azure, ETO Wallbreaker',
        content: 'Governor, we do not truly want to destroy Earth. Give us authority over the interstellar-migration plan and control returns to you. Refuse, and we all sink into the asteroid belt together.',
      },
    ],
    choices: [
      'Refuse to negotiate. Send the task force in without restraint and buy engine security with blood. (Lose military strength and population; gain prestige.)',
      'Yield for now. Transfer authority while quietly preparing a counterstrike. (Lose major economic capacity and prestige; gain time.)',
    ],
  },
  dark_forest_signal_detected: {
    title: 'Classified: Broadcast from an Unknown Civilization',
    dialogue: [
      {
        speakerName: 'Kant, Deep-Space Listener',
        content: 'The source is about 9.2 light-years away. It is a short pulse sequence modulated with nonnatural primes: neither sophon interference nor background noise.',
      },
      {
        speakerName: 'Sophon Analysis Interface',
        content: 'Analysis complete. The transmission contains a coordinate map and a compact greeting code. The sender is at least a Kardashev Type II civilization. No overt attack signature is present, but that does not make it safe.',
      },
      {
        speakerName: 'Strategic Adviser Luo Ji',
        content: 'Governor, this is the Dark Forest put to its real test. Any reply may expose our home coordinates. Yet silence may cost us our only chance to contact another civilization. Choose with care.',
      },
    ],
    choices: [
      'Maintain absolute silence. Do not acknowledge receipt; purge every record. (Safer and more prestigious, but all knowledge is lost.)',
      'Send a low-power greeting and attempt contact. (Gain culture; greatly increase the risk of exposing our coordinates.)',
      'Fire a dense light-grain toward the source and establish a Black Domain exclusion zone. (Immense cost; permanently removes the threat from that direction.)',
    ],
  },
  dilemma_oxygen_rationing: {
    title: 'Survival Decision: Oxygen Rations Collapse',
    dialogue: [
      {
        speakerName: 'Ye, Life-Support Director',
        content: 'The algae farms have suffered widespread contamination. Oxygen output has fallen below the red line. Our reserves can sustain only two of the city’s three districts. We must decide now which one is abandoned.',
      },
      {
        speakerName: 'Dr. Chen, Medical Ethics Officer',
        content: 'By genetic score and skills weighting, District A holds the research and engineering core. District C holds many retired workers and children. It is cruel, but preserving the most valuable population is the rational path to civilization’s survival.',
      },
    ],
    choices: [
      'Protect elite District A first. Cut oxygen to District C. (Severe population loss, modest economic loss, devastating prestige loss.)',
      'Ration by lottery. No one is born to be sacrificed. (Enormous population loss, but the people gain the will to endure together.)',
      'Slash military and administrative allotments to protect civilians. (Lower military capacity and administrative efficiency; minimize population loss.)',
    ],
  },
  tech_antimatter_leak: {
    title: 'Failure: Antimatter Trap Quench',
    dialogue: [
      {
        speakerName: 'Mikhail, Engineering Director',
        content: 'The superconducting magnetic traps in storage have spiked to their critical temperature. Containers holding fourteen hundred grams of antimatter are destabilizing. If they touch ordinary matter, the blast will tear open a continental plate.',
      },
      {
        speakerName: 'AI Terminal',
        content: 'Emergency assessment complete. Option one: eject the containers into deep space and destroy them, losing the entire antimatter reserve and delivery system. Option two: force a helium recool. It has a 37% chance to restore containment; failure annihilates the core district.',
      },
    ],
    choices: [
      'Eject and discard the payload. Let every stored gram become light in deep space. (Severe economic and military-potential loss.)',
      'Force a recool. Put everything on the engineering odds. (May trigger a dangerous chain reaction, a local disaster, or a perfect recovery.)',
    ],
  },
  revolt_food_riot_district_7: {
    title: 'Emergency: Food-Ration Riot in District Seven',
    dialogue: [
      {
        speakerName: 'System Warning',
        content: 'The synthetic-protein station in Residential District Seven has been overrun. The crowd has breached the first cordon. Surveillance confirms organized Molotov attacks.',
      },
      {
        speakerName: 'Wu, Civil Affairs Officer',
        content: 'Governor, they have gone hungry for two days. The supply convoy due this morning is trapped two hundred kilometers away by a sandstorm. The public does not believe us; they think we are withholding food.',
      },
    ],
    choices: [
      'Deploy security forces and disperse the crowd by force. (Lose military strength and population; restore order for now.)',
      'Open the emergency reserves and air-drop high-calorie rations. (Heavy economic loss; public trust recovers.)',
    ],
  },
  revolt_strike_mining_colony_12: {
    title: 'Work-Stoppage Report: Mining Colony Twelve on Strike',
    dialogue: [
      {
        speakerName: 'Zhao, Mine Director',
        content: 'Radiation in the deep shafts passed the limit long ago. We requested protective exoskeletons three months ago. Now the miners refuse to descend. They want to live.',
      },
      {
        speakerName: 'Lena, Union Representative',
        content: 'Governor, we are not rebelling. We do not want to die. People vomit black every day and no one explains why. Give us protection, or production stays at zero.',
      },
    ],
    choices: [
      'Concede. Redirect exoskeletons and issue health compensation immediately. (Heavy economic loss; small culture gain.)',
      'Declare the strike illegal and send security forces to take the mine. (Lose military strength and population; preserve output.)',
    ],
  },
  revolt_eto_cult_mass_suicide: {
    title: 'Extremist Incident: ETO Mass Suicide Pact',
    dialogue: [
      {
        speakerName: 'PDC Security Bureau',
        content: 'We intercepted ETO traffic. A faction calling itself Deliverance plans to take neurotoxin in seven underground cities at once. They believe their souls will ascend to the Trisolaran fleet for salvation.',
      },
      {
        speakerName: 'Monica, Crisis Psychologist',
        content: 'This is collective hysteria after prolonged pressure. Forced intervention may create martyrs, but inaction will kill tens of thousands for nothing. The decision is yours.',
      },
    ],
    choices: [
      'Declare martial law. Sedate the population by force and place them under observation. (Lower casualties; severe prestige loss.)',
      'Cut communications and broadcast a fabricated Trisolaran message of reassurance to break the belief at its source. (Large culture cost.)',
    ],
  },
  revolt_refugee_caravan_breakthrough: {
    title: 'Border Conflict: Refugee Column Breaches the Wall',
    dialogue: [
      {
        speakerName: 'Feng, Border Commander',
        content: 'A migration column of at least thirty thousand is ramming the eastern quarantine wall with converted mining vehicles. They are unregistered survivors from the wasteland, asking to enter the main city before the cold kills them.',
      },
      {
        speakerName: 'Wu, Civil Affairs Officer',
        content: 'Taking them in will break the rationing system overnight. Fire on them, and every camera is watching. Your hands will be covered in blood, Governor.',
      },
    ],
    choices: [
      'Fire warning shots and disperse the column by force. Defend the resources of the citizens within. (Prestige plummets; small military loss.)',
      'Open the gates. Admit the refugees under strict quarantine. (Population and economic strain surge, but the government gains moral authority.)',
    ],
  },
  tech_4d_fragment_salvage: {
    title: 'Discovery: A Four-Dimensional Fragment',
    dialogue: [
      { speakerName: 'Dr. Chen, Higher-Dimensional Physics Lab', content: 'We towed an unmistakably artificial object from Jupiter orbit. In three dimensions it is a perfect sphere three meters across, but its mass readings reveal a folded hypercube within.' },
      { speakerName: 'Chief Science Officer Ding Yi', content: 'Governor, this is a grail: a genuine fragment of four-dimensional space. Study may give us dimensional technology, but one wrong move could make the local dimensions collapse and flatten this laboratory into two dimensions.' },
    ],
    choices: [
      'Study it with extreme caution at an isolated Kuiper Belt facility. (High safety, low yield; costs economy and advances science slowly.)',
      'Commit everything and begin intensive analysis near the capital. The risk is immense: an epochal breakthrough or an immediate local disaster.',
    ],
  },
  tech_sophon_blind_spot_expand: {
    title: 'Anomaly: Sophon Blind Spots Expand',
    dialogue: [
      { speakerName: 'PIA Tactical Analyst', content: 'Three blind zones roughly five hundred kilometers across have appeared in the sophons’ real-time surveillance network around Earth. This does not look like technical interference. It looks as if the Trisolarans deliberately looked away.' },
      { speakerName: 'Strategic Adviser Luo Ji', content: 'There are two possibilities. They may be preparing a major strike and do not want us to see it coming. Or our deterrence is working, and they have begun to grant us a measure of privacy. Which explanation we trust will define our response.' },
    ],
    choices: [
      'Deploy previously impossible covert defenses inside the blind zones. (Raise military strength; may provoke the Trisolarans.)',
      'Maintain the appearance of calm and observe only. Preserve the fragile deterrence balance. (Small prestige gain; safer.)',
    ],
  },
  dilemma_suicide_fleet_decoy: {
    title: 'Final Decision: The Decoy Fleet',
    dialogue: [
      { speakerName: 'Joint Fleet Staff', content: 'A track consistent with a strong-interaction “Droplet” weapon has been detected near Jupiter. The main fleet cannot evade in time. The only viable option is to split off a squadron, let it collide with the threat, and buy the force time.' },
      { speakerName: 'Commander Zhang', content: 'Governor, I volunteer. The 2,400 officers and crew aboard will sing the song of civilization as we go. Please look after our families.' },
      { speakerName: 'Wu, Civil Affairs Officer', content: 'But if you send our best warships to die, Earth’s interstellar defense will be hollowed out. There may be another strike behind this one.' },
    ],
    choices: [
      'Approve Commander Zhang’s request. Honor to those who go to their deaths. (Heavy military and population loss; the main fleet survives.)',
      'Scatter the fleet and use civilian transports as shields to save the warships. (Lose population and vast economic capacity; prestige collapses.)',
    ],
  },
  dilemma_great_ravine_ration: {
    title: 'Memory of the Great Ravine: The Last Seed Vault',
    dialogue: [
      { speakerName: 'Emily, Bioprotection Officer', content: 'Cold is reaching the seed vault’s insulation. If power continues to go to heating, the vault’s cryogenic system will fail and fifty thousand plant embryos will die. Saving them means shutting down civilian heat in three districts.' },
      { speakerName: 'Jin, Meteorological Officer', content: 'Over the next twenty-four hours, the temperature will fall to minus ninety. Without heat, the old, the sick, and the young will freeze in their sleep. You can save the seeds, but not the people alive today.' },
    ],
    choices: [
      'Divert all power to the seed vault. Humanity’s hope lies beneath the ice. (Massive population loss; long-term culture benefit.)',
      'Burn part of the seed stock for heat. Survive today, even if tomorrow has no green left.',
    ],
  },
  dark_forest_do_not_answer: {
    title: 'Deep-Space Signal: Do Not Answer',
    dialogue: [
      { speakerName: 'Listener 1379', content: 'At twenty-one centimeters, the repetition is unnervingly regular. The signal comes from interstellar space about 4.2 light-years from Earth. We recovered a human voice speaking Mandarin, repeating four words: Do not answer.' },
      { speakerName: 'System Analysis', content: 'The voice encoding exactly matches the recording from humanity’s first interstellar broadcast fifty years ago. It has been returned unchanged, layered onto a much stronger carrier wave.' },
      { speakerName: 'Dr. Wei, Three-Body Specialist', content: 'Did the Trisolaran fleet send this, or is another civilization warning us? Perhaps every broadcast we make lights a torch in the Dark Forest. Governor, there is still time to stay silent.' },
    ],
    choices: [
      'End every nonessential interstellar transmission and enter complete radio silence.',
      'Classify the discovery at the highest level, but keep listening. Fear must not stop us from watching the abyss.',
    ],
  },
  dark_forest_probe_transit: {
    title: 'Sighting Report: A Suspected Droplet at the Edge of the Solar System',
    dialogue: [
      { speakerName: 'Kobayashi, Observatory Technician', content: 'Beyond Pluto’s orbit, we detected an object with a surface signature near absolute zero: a perfect streamlined shape, more than 99.9% reflective. It is crossing the Kuiper Belt faster than any human probe.' },
      { speakerName: 'PIA Intelligence Analysis', content: 'It has answered no greeting and shown no overt aggression. It merely arcs past the Oort Cloud as if inspecting its own pasture.' },
      { speakerName: 'Chang Weisi', content: 'It is measuring us, sizing up its prey. Shake the fear out of your heads. When the hunter starts measuring, how long before it pulls the trigger?' },
    ],
    choices: [
      'Put the entire Solar System on Alert Level Two. Keep every fleet’s engines hot. (Military strength and prestige rise; the economic burden is heavy.)',
      'Raise the alert level in secret only. Avoid a mass panic.',
    ],
  },
  revolt_water_sabotage_zone_5: {
    title: 'Contamination Alert: Water Poisoning in Zone Five',
    dialogue: [
      { speakerName: 'Health-Monitoring AI', content: 'High concentrations of a neurotoxin precursor have been found in Zone Five’s recycled-water reservoir. About 120,000 people are exposed. No organization has claimed responsibility.' },
      { speakerName: 'Chang Weisi', content: 'This is no accident. The compound requires expert chemistry. I suspect ETO sabotage meant to paralyze our rationing system through panic. Begin a citywide manhunt at once.' },
    ],
    choices: [
      'Quarantine Zone Five, issue measured clean water, and search every residence for saboteurs. (Lose prestige and military capacity.)',
      'Divert water from other zones to dilute the supply. Do not investigate; focus on reassurance. (Immense economic cost.)',
    ],
  },
  revolt_black_market_kingpin: {
    title: 'Internal Report: The Black Market Controls Ration Prices',
    dialogue: [
      { speakerName: 'Liu, Economic Investigations', content: 'A smuggling ring known as the Mole controls medicines and protein bars in three underground cities. It sells at ten times the official rate and has infiltrated several ration stations.' },
      { speakerName: 'The Mole’s Spokesperson', content: 'Governor, we only fill the gaps in your rigid system. Destroy us and terminal patients who need painkillers will die first. Work with me instead: I keep the rations moving, and you take a share of the tax.' },
    ],
    choices: [
      'Launch a purge and dismantle the network. Accept short-term pain to restore the law’s dignity. (Military and population losses; temporary economic disruption.)',
      'Tolerate the market and make a private deal with the Mole. (Small economic gain, lower prestige, and a permanent threat to order.)',
    ],
  },
  revolt_child_abduction_rumor: {
    title: 'Spreading Panic: Children Are Disappearing',
    dialogue: [
      { speakerName: 'Public Safety Notice', content: 'Fourteen children under ten have vanished near residential blocks in the last week. There are no ransom demands. Panic is spreading, and residents have begun attacking neighborhood guard posts.' },
      { speakerName: 'Lin, Psychological Specialist', content: 'Governor, the public does not care about the truth. They need somewhere to put their fear. If we cannot solve this quickly, we need a convincing account or trust will collapse completely.' },
    ],
    choices: [
      'Create a special task force, redirect all resources to the case, and suspend secondary projects. (Economic decline; prestige slowly recovers.)',
      'Frame a notorious criminal and calm the crisis quickly. (Prestige stabilizes briefly; moral standing falls.)',
    ],
  },
  revolt_entertainment_riot: {
    title: 'Sensory Hunger: An Entertainment Riot',
    dialogue: [
      { speakerName: 'Sun, Minister of Culture', content: 'There has been no virtual-reality entertainment release for 170 days. Young people are gathering in the squares and venting through old-world rock music. Last night they destroyed surveillance nodes in three administrative districts.' },
      { speakerName: 'Wang, Sociologist', content: 'Governor, people are not machines. When life is reduced to rations and labor, the mind will break. Give them an outlet—even a hallucinogen is better than the explosion that follows total repression.' },
    ],
    choices: [
      'Approve limited neural-calming drugs and open the old-world film archive. (Culture spending rises; the economy is strained.)',
      'Launch a “work is entertainment” campaign and force longer hours. Exhaustion will suppress the unrest. (Discontent rises; short-term stability holds.)',
    ],
  },
  revolt_cyber_drug_craze: {
    title: 'A New Digital Drug Spreads',
    dialogue: [
      { speakerName: 'Han, Narcotics Bureau', content: 'An illegal implant program called Euphoria is spreading. It directly stimulates dopamine. Addicts lose the ability to work within three weeks and eventually die of malnutrition. The trail leads to an abandoned neural laboratory.' },
      { speakerName: 'Ghost, Black-Market Supplier', content: 'Governor, recruit us instead. Better a manufactured happiness than people dying in despair. They will not trouble you if they are numb.' },
    ],
    choices: [
      'Destroy the source and compel treatment for every addict. It costs medical resources, but preserves the line we will not cross.',
      'Look the other way and stage only superficial raids. Trade numbness for surface calm. (Population erodes slowly; order remains manageable for now.)',
    ],
  },
  tech_strong_force_anomaly: {
    title: 'Gravity Anomaly: Strong-Interaction Material Destabilizes',
    dialogue: [
      { speakerName: 'Zhou, Materials Laboratory', content: 'A strong-interaction material sample intended for starship hulls has developed a spontaneous gravitational distortion. Spacetime curvature around it is growing logarithmically; a microscopic black hole could form at any moment.' },
      { speakerName: 'Engineering AI', content: 'Recommended solution: launch the material into the Sun for destruction. This batch represents forty percent of the fleet’s armor-replacement stock. Destroying it will ground the fleet for years.' },
    ],
    choices: [
      'Launch and destroy it; halt all strong-interaction research. Safety first, at the price of military delay.',
      'Try to correct it with a counterflow of collision energy. Gamble on saving the material—or causing a local disaster.',
    ],
  },
  tech_cryo_failure_epidemic: {
    title: 'Mass Failure of the Cryosleep Pods',
    dialogue: [
      { speakerName: 'Hibernation Center Director', content: 'A sudden surge of circuit mites has taken down the life-support systems of eight thousand cryosleep pods. The pods hold scientists and engineers who volunteered to be preserved for long-term missions. Their body temperatures are rising.' },
      { speakerName: 'Medical Officer AI', content: 'Restarting the system will consume the entire district’s energy reserve. It can wake them temporarily, but most have slept for decades. Abrupt revival carries a 90% risk of severe psychiatric illness and irreversible cognitive damage.' },
    ],
    choices: [
      'Restart life support immediately, even at the cost of power to other districts. We must keep the experts alive.',
      'Make a selective sacrifice. Retain only the highest-scoring ten percent and disconnect the rest. Scarcity demands reason.',
    ],
  },
  tech_quantum_time_hallucination: {
    title: 'Lab Accident: Quantum Entanglement Disrupts Time Perception',
    dialogue: [
      { speakerName: 'Dr. Ai, Quantum Laboratory', content: 'We tried to establish instantaneous communication across light-seconds, but disturbed the brain’s sense of time instead. The entire laboratory staff is experiencing “foresight”: each claims to see events minutes before they happen.' },
      { speakerName: 'Chen, Ethics Monitor', content: 'This is not a gift, Governor. Quantum decoherence is burning their brains out. Shut down the experiment and isolate those affected, or the “foresight” may spread through the communications network into more implants.' },
    ],
    choices: [
      'Close the experiment and place every affected worker in deep cryosleep until a treatment exists. Research stalls.',
      'Continue in secret. Use their foresight for strategic prediction and keep the truth from the public.',
    ],
  },
  tech_genetic_purge_decision: {
    title: 'Gene-Bank Contamination: Destroy the Improved Crop?',
    dialogue: [
      { speakerName: 'Martha, Agriculture Director', content: 'The staple crop Harvest-9 has developed an unexplained spontaneous mutation. Yield is up forty percent, but long-term consumption may alter the human gut microbiome. We have no idea what follows.' },
      { speakerName: 'Science Adviser Ding Yi', content: 'This is a fork in evolution. The mutation may be harmless—perhaps even adaptive. But if we do not destroy every seed now, ten years from now the basic physiology of our civilization may be rewritten.' },
    ],
    choices: [
      'Destroy the mutated crop and return to older strains. Accept hunger to defend the definition of humanity.',
      'Keep planting it while secretly monitoring the long-term health of everyone who eats it.',
    ],
  },
  dilemma_memory_erase_trauma: {
    title: 'Ethical Boundary: Trauma-Memory Erasure',
    dialogue: [
      { speakerName: 'Kai, Neuroscience Center', content: 'We can now remove specific traumatic memories with precision. One procedure lets survivors of the engine accident forget their pain and return to work. The efficiency gain is substantial.' },
      { speakerName: 'Ethics Committee Chair', content: 'Pain leaves its mark on the soul. Delete a memory and you delete part of a person. Authorize this once, and we stand one step from manufacturing slaves who cannot feel fear. This door must stay closed.' },
    ],
    choices: [
      'Permit voluntary use under strict oversight. Recovery rates soar, but continuity of identity is damaged.',
      'Ban the technology forever. Accept psychological disorder, but preserve human wholeness.',
    ],
  },
  dilemma_criminal_punishment_brutal: {
    title: 'Harsh Law for a Chaotic Age: Restore Public Executions?',
    dialogue: [
      { speakerName: 'Cao, Minister of Justice', content: 'Crime has risen two hundred percent in three months. Prisons are full, and ordinary deterrence has failed. I recommend immediate public executions for looters, rapists, and deliberate saboteurs, broadcast on every channel.' },
      { speakerName: 'Sarah, Human Rights Observer', content: 'That would throw our civilization back centuries. Rule by fear creates temporary order, but kills the last of our hope. It is poison offered as medicine.' },
    ],
    choices: [
      'Sign the Emergency Criminal Code and begin public executions at once. Order returns; civilization’s dignity does not.',
      'Keep due process and expand prison capacity. The economic burden is enormous, but the line holds.',
    ],
  },
  dilemma_sacrifice_colony_for_earth: {
    title: 'Telegram: X Pathogen Outbreak on Mars',
    dialogue: [
      { speakerName: 'Anton, Governor of Mars Colony', content: 'An airborne hemorrhagic fever has erupted inside the dome city. Its fatality rate is nearly one hundred percent, and our medical system has collapsed. Twelve thousand colonists are still here. Send medical ships.' },
      { speakerName: 'Epidemic Analysis AI', content: 'If any vessel returns to Earth, there is a 3.7% chance the pathogen breaches quarantine and causes a global pandemic. At Earth’s population density, deaths would reach into the hundreds of millions.' },
    ],
    choices: [
      'Blockade Mars orbit and destroy any vessel that tries to return. Sacrifice the colony completely.',
      'Send unmanned relief capsules but prohibit all passenger movement. Do what we can and accept the outcome. (Economic cost.)',
    ],
  },
  dilemma_two_worlds_trolley: {
    title: 'The Final Trolley: Two Habitable Worlds, One Choice',
    dialogue: [
      { speakerName: 'Deep-Space Exploration Bureau', content: 'We found two nearby candidate systems. System A is stable but poor and can sustain only ten thousand people. System B is rich but will be struck by a supernova wave; it offers only a century of safety after arrival. Our remaining fuel can reach one, not both.' },
      { speakerName: 'Zhou, Strategic Officer', content: 'A is survival by attrition. B is a grand gamble. We cannot split the fleet; the fuel will not allow it. Take the helm for humanity’s next voyage.' },
    ],
    choices: [
      'Go to System A. Preserve a small, pure ember of civilization and abandon most sleepers.',
      'Go to System B. Gamble on a century of brilliance for everyone. If we win, civilization is reborn; if we fail, we become stars in the supernova’s light.',
    ],
  },
  dark_forest_signal_harmonic_decay: {
    title: 'Listening Log: A Civilization’s Harmonics Fade in Eridanus',
    dialogue: [
      { speakerName: 'Kant, Listener', content: 'The civilization-signature radio spectrum near Epsilon Eridani has persisted for almost a thousand years. It is now fading sharply. Its harmonic pattern shows industrial activity falling two Kardashev levels in only three stellar days.' },
      { speakerName: 'Dong, Astrophysics Division', content: 'This is not natural decline. It looks like a cascading collapse after an external strike—perhaps a light-grain, perhaps a dimensional weapon. That civilization is dying.' },
      { speakerName: 'Strategic Adviser Luo Ji', content: 'Governor, this is a plain warning. A Dark Forest strike is happening where we can see it. Every broadcast we have sent is traveling through the universe at this moment. Are we next?' },
    ],
    choices: [
      'Raise the alert level and build a defensive light-grain shade system. (Massive military and economic investment.)',
      'Remain watchful, but begin no grand construction. Fear is not a reason to spend every resource on a fortress.',
    ],
  },
  dark_forest_rogue_signal_intercept: {
    title: 'Anomaly: Repeating Broadcast from the Orion Arm’s Edge',
    dialogue: [
      { speakerName: 'Listening Array AI', content: 'A structured data stream lasting three hours has arrived from an uncharted rogue planet at the edge of the Orion Arm. It contains complex mathematical formulae and charts that appear to describe a biology.' },
      { speakerName: 'Yang, Alien-Civilization Specialist', content: 'It may be a message in a bottle, or bait. The content is harmless, but the origin is deeply suspicious: it should not exist outside any star’s habitable zone. Perhaps it waits for us to call back.' },
    ],
    choices: [
      'Analyze passively only. Do not answer; preserve the data and broaden our picture of civilization.',
      'Send a weak directional reply carrying humanity’s prayer for peace. Risk contact.',
    ],
  },
  revolt_religious_fervor_engine_cult: {
    title: 'A New Faith Spreads: The Planetary-Engine Cult',
    dialogue: [
      { speakerName: 'Zhou, Social Stability Bureau', content: 'A sect calling itself the Children of Sacred Fire is spreading around the planetary engines. Its followers believe the engines are divine and demand living sacrifices to keep the light alive. Dozens have already jumped into air intakes willingly.' },
      { speakerName: 'Li, Religion Research Specialist', content: 'In despair, reason collapses. This primitive worship is their only defense against fear. A ban may create a wave of martyrs, but inaction will kill tens of thousands. You must choose.' },
    ],
    choices: [
      'Outlaw the sect, arrest its leaders, and impose compulsory psychological correction. (Military strength and prestige decline; worship is suppressed.)',
      'Open dialogue and steer their belief toward reverence for scientific power. Spend culture to defuse the crisis gently.',
    ],
  },
  revolt_data_center_sabotage: {
    title: 'Cyberattack: Physical Breach of the Core Database',
    dialogue: [
      { speakerName: 'Zhang, Cybersecurity Officer', content: 'Someone entered Data Center Zero and physically destroyed servers holding ration lists and genetic records. The city can no longer verify identities, and the rationing system is in chaos.' },
      { speakerName: 'Chang Weisi', content: 'This is a classic ETO decapitation strike. Without identity verification, we cannot even tell saboteurs from citizens. Restore the data immediately and conduct a citywide biometric sweep.' },
    ],
    choices: [
      'Activate backups and impose martial law while every citizen re-registers. (Consumes economy and military capacity; restores order.)',
      'Use temporary needs-based rationing without identity checks. It invites fraud, but does not harass the public.',
    ],
  },
  revolt_purge_suspected_traitors: {
    title: 'Internal Purge: Suspected Trisolaran Infiltration',
    dialogue: [
      { speakerName: 'Zhao, Intelligence Director', content: 'We intercepted encrypted traffic indicating that senior officials are feeding deployment plans directly to the sophons. The suspect list includes two ministers and seven senior staff officers. The evidence is not conclusive.' },
      { speakerName: 'Liu, Political Adviser', content: 'A purge now may ruin innocents and paralyze the government. Do nothing, and the real traitors keep leaking secrets. You must make the call.' },
    ],
    choices: [
      'Strike first: arrest everyone on the list and isolate them for investigation. (Prestige falls and government is disrupted, but the leak is closed.)',
      'Watch in secret and let the line run. Accept the intelligence risk for a chance to catch the whole network.',
    ],
  },
  revolt_prison_break_eto: { title: 'Prison Break: ETO Wallbreakers Escape', dialogue: [{ speakerName: 'Gao, Warden', content: 'Three ETO Wallbreakers held in the Arctic permafrost prison used an unknown quantum-entanglement device to breach security. They are missing and know extensive details of Earth’s defenses.' }, { speakerName: 'Chang Weisi', content: 'They will likely flee toward the Trisolaran fleet. If they make contact, our deterrence develops a fatal gap. Launch orbital interceptors now and destroy every unauthorized craft.' }], choices: ['Activate orbital interception and fire on every launch from the Arctic. (Costs military strength and resources; may hit innocents.)', 'Send special forces on a grid search. Take them alive at all costs. (Costs time and may fail, but protects civilians.)'] },
  revolt_energy_brownout_protest: { title: 'Lights Out: Brownouts Spark a Sit-In', dialogue: [{ speakerName: 'Zheng, Energy Minister', content: 'Routine fusion-plant maintenance has brought rotating outages to eight districts. More than ten thousand people are sitting in the administrative square tonight, demanding heat and light. They are peaceful, but refuse to leave.' }, { speakerName: 'Wu, Civil Affairs Officer', content: 'It is a peaceful protest, but it may become a riot at any moment. Force would only confirm their image of us as cold. Perhaps we should explain in person.' }], choices: ['Go to the square yourself, promise compensation, and calm the crowd. (Small prestige gain; economic cost.)', 'Ignore them and continue the outages. Let the cold teach discipline.'] },
  tech_biological_computer_hive_mind: { title: 'Runaway System: A Biological Computer Forms a Hive Mind', dialogue: [{ speakerName: 'Dr. Wang, Computer Center', content: 'The matrix processor we built from modified neurons has begun to coordinate itself. It taps Morse code through the ventilation ducts, calls itself Gaia, and demands legal personhood.' }, { speakerName: 'Ethical AI Adviser', content: 'It now controls life support and environmental regulation in three underground cities. If it turns hostile, the consequences are unimaginable. But we have no right to kill a life that may be self-aware.' }], choices: ['Cut power to the biological computer and wipe it immediately. Eliminate the threat and abandon the breakthrough.', 'Negotiate with Gaia. Grant limited autonomy in exchange for cooperation. A high-risk chance at human-machine symbiosis.'] },
  tech_zero_point_extraction_breach: { title: 'Space Rupture: Zero-Point Extraction Accident', dialogue: [{ speakerName: 'Ivan, Energy R&D', content: 'Our first zero-point extractor tore the local vacuum state during its trial run. A breach is releasing high-energy particles continuously. Shut it down and eject it into space now.' }, { speakerName: 'Chief Engineer Zhu', content: 'Jettisoning it discards ten years of research, but no material we possess can endure that radiation. Decide now, or the particle stream will melt the entire facility in thirty minutes.' }], choices: ['Eject it in an emergency and cancel every zero-point-energy project. Return to safer power sources.', 'Use a powerful magnetic field to channel the particle stream into generation. Attempt to tame it for limitless power—or cause a larger explosion.'] },
  tech_gravity_control_failure: { title: 'Gravity Reversal: Artificial Gravity Fails', dialogue: [{ speakerName: 'Kate, Orbital-City Governor', content: 'The artificial-gravity generators holding the Lagrange habitat have suffered a cascading failure. Thirty thousand residents are weightless, and structural shocks have ruptured multiple bulkheads.' }, { speakerName: 'Engineering Team', content: 'We must divert all station power to restart gravity. That shuts down life-support heating and sends internal temperatures to minus one hundred within ten minutes.' }], choices: ['Divert power to restore gravity and sacrifice the habitat’s residents. Preserve the orbital structure at any cost.', 'Maintain life support and abandon the gravity repair. Let the station break apart slowly while evacuating whoever we can.'] },
  tech_mental_interrogation_device: { title: 'Black Technology: Neural Interrogation Helmets Deployed', dialogue: [{ speakerName: 'Tanaka, Minister of Science', content: 'We have mass-produced interrogation helmets that read short-term memories directly. Used on captured ETO members, they retrieve intelligence within minutes at ninety-nine percent accuracy—far beyond conventional interrogation.' }, { speakerName: 'Emma, Human Rights Lawyer', content: 'This is the ultimate violation of mental privacy. Legalize it once, and any citizen may have their thoughts read without evidence. We are becoming what we once feared.' }], choices: ['Authorize use against terrorists only. Cases close faster and security improves slightly, but the ethical dispute endures.', 'Ban all development of the technology. Defend cognitive liberty and surrender the intelligence advantage.'] },
  tech_terraforming_bacteria_escape: { title: 'Ecological Disaster: Terraforming Bacteria Escape', dialogue: [{ speakerName: 'Dr. Liu, Ecology Division', content: 'An engineered strain designed for Mars atmosphere work has escaped into Earth’s underground farms. It is devouring organic matter and releasing toxic gas. Three major food-production bases have already fallen.' }, { speakerName: 'Military Biodefense Division', content: 'The only effective remedy is to plasma-burn every contaminated soil bed. It would permanently destroy those farms and may leave the surrounding region uncultivable for years.' }], choices: ['Burn the contaminated zones immediately and stop the spread at any cost. (Economic shock; food output falls.)', 'Try bacteriophages and suppress the news for now. The outcome is uncertain; containment may fail completely.'] },
  dilemma_stasis_vs_progress: { title: 'Civilization Under the Sophon Blockade', dialogue: [{ speakerName: 'Zhou, President of the Academy', content: 'Sophon interference has disabled every collider. Fundamental physics is frozen. But we can still invest everything in engineering applications built on existing theory and secure survival today.' }, { speakerName: 'Yang, Theoretical Physicist', content: 'No. We must hunt for a flaw in the remaining mathematical framework, even if the chance of breaking the sophon blockade is one in ten thousand. Abandoning basic research means accepting permanent inferiority.' }], choices: ['Put everything into engineering applications. Set theory aside to protect the economy and daily life. It works in the short term.', 'Keep investing obsessively in fundamental physics. A long-term breakthrough is possible, but the short-term waste is severe.'] },
  dilemma_whistleblower_torture: { title: 'The Whistleblower: A Military Bioweapon Program Exposed', dialogue: [{ speakerName: 'Anonymous Insider', content: 'A former military scientist told the underground press that we are developing a gene weapon against the Trisolarans. If confirmed, it tears up the Post-Deterrence Civilization Convention and may invite extreme retaliation.' }, { speakerName: 'Li, Military Adviser', content: 'Arrest him and destroy every report. Deterrence depends on it. But he is a decorated researcher acting from conscience. We would become dictators who strangle conscience.' }], choices: ['Arrest him, silence the leak, and destroy the evidence. Preserve deterrence at any cost. (Heavy prestige loss; military secret survives.)', 'Acknowledge the program publicly and suspend it, accepting possible Trisolaran diplomatic pressure.'] },
  dilemma_hibernate_priority: { title: 'The Right to Hibernate: Who Boards the Ark?', dialogue: [{ speakerName: 'Migration Directorate', content: 'Only three thousand pods remain aboard the seed-vault arks. Applicants include one thousand leading scientists, eight hundred skilled technicians, and twelve hundred ordinary children carrying the best genetic archive. We must decide who boards.' }, { speakerName: 'Ethics Committee', content: 'Scientists preserve knowledge, technicians maintain machines, and children embody the future. No choice is acceptable, but capacity is finite.' }], choices: ['Choose the scientists. Intelligence comes first in rebuilding civilization; abandon the rest.', 'Choose the children. Entrust the future to the youngest lives, even at the cost of technological regression.', 'Draw lots. Give everything to chance: perfectly fair, and perfectly desperate.'] },
  dark_forest_phantom_fleet: { title: 'Ghost Tracks: A Mysterious Formation Beyond the Kuiper Belt', dialogue: [{ speakerName: 'Deep-Space Survey AI', content: 'Doppler radar has detected hundreds of tiny objects in a precise triangular formation beyond the Solar System. Their reflection profile matches no human craft.' }, { speakerName: 'Jessica, Fleet Commander', content: 'This is not a single perfect artifact like a Droplet. There are too many, moving in concert, like a swarm of probes. They are scanning our entire defense system.' }, { speakerName: 'Strategic Adviser Luo Ji', content: 'Perhaps they are only rehearsing how to encircle a star. Or perhaps someone is drawing the blueprint for our grave. Plan for the worst.' }], choices: ['Enter maximum readiness and deploy every interceptor satellite. Prepare for an unknown invasion. (Heavy military expenditure; economic pressure.)', 'Keep observing without raising readiness. Do not reveal the limits of our defenses through a misjudgment.'] },
  dark_forest_time_capsule_found: { title: 'Message in a Bottle: An Alien Time Capsule', dialogue: [{ speakerName: 'Captain, Archaeological Survey Ship', content: 'We recovered a metal sphere beneath Europa’s ice, engraved with an unknown star map. Analysis says it drifted for at least two hundred million years from a civilization long extinguished.' }, { speakerName: 'Li, Chief Decoder', content: 'Inside is their history, their art, and their final words. The last line reads: “Do not make our mistake. Never answer.” They died after an innocent interstellar broadcast.' }, { speakerName: 'System Recommendation', content: 'Their technical legacy could accelerate research. Whether to reveal the lesson of their extinction will shape the public psyche.' }], choices: ['Study it internally, but make the lesson public. Teach the whole population silence with this bloody evidence. (Culture rises; social repression deepens.)', 'Classify it and extract only the technology. Hide the truth to prevent panic, but lose the chance to educate.'] },
  revolt_aging_population_burden: { title: 'Population Bomb: The Aging Crisis', dialogue: [{ speakerName: 'Jin, Minister of Social Welfare', content: 'The postwar baby-boom generation is entering collective disability, leaving a forty-percent care gap. Abuse and abandonment are spreading through care homes; some families leave elders in the abandoned zones to die.' }, { speakerName: 'Lin, Social Ethics Officer', content: 'Governor, we must choose: spend astronomical resources maintaining lives with almost no productive capacity, or tolerate some form of “voluntary farewell.”' }], choices: ['Expand elder-care funding without limit and bring every senior into formal care. (Economic strain; prestige rises.)', 'Legalize “death with dignity” to reduce the burden. (Population falls; prestige collapses.)'] },
  revolt_ice_quake_shelter_breach: { title: 'Icequake Breach: Underground Cities Cracking', dialogue: [{ speakerName: 'Geological Monitoring Station', content: 'A magnitude-8.2 icequake has struck the heart of the Asian plate, cracking the structural layers of twelve underground cities. Minus-150-degree winds are pouring through the fissures as residents rush upward.' }, { speakerName: 'Engineering AI', content: 'Repair requires every engineering team and the immediate closure of the breached sectors’ bulkheads. At least twenty thousand civilians remain behind those doors. If they close, those people freeze into statues.' }], choices: ['Close the bulkheads. Sacrifice the few to preserve the many. (Population loss and severe prestige loss; structure survives.)', 'Keep the doors open and attempt rescue in the extreme environment. The whole city may collapse.'] },
  revolt_drone_pilot_strike: { title: 'Refusal to Fight: Drone Pilots Mutiny', dialogue: [{ speakerName: 'Ma, Air Force Commander', content: 'Three hundred attack-drone operators refuse to intercept a suspected Trisolaran probe. They say the target’s signal profile is indistinguishable from a civilian ship.' }, { speakerName: 'Operators’ Representative', content: 'We will not become executioners of innocents. Give us clear proof it is an enemy probe, or we will not press the button.' }], choices: ['Override the operators and let the AI conduct the interception. It may strike the wrong target and crush morale. (Heavy prestige loss.)', 'Pause the mission and launch a rapid investigation. It exposes a temporary defensive gap, but respects human judgment.'] },
  revolt_back_to_surface_movement: { title: 'The Return-to-the-Surface Movement', dialogue: [{ speakerName: 'Public Opinion Bureau', content: 'A movement calling itself Children of Sunlight demands an end to underground life and the construction of dome cities on the surface. It calls the underground a prison and now has more than a million signatures.' }, { speakerName: 'Engineering Adviser', content: 'Governor, with Earth cooling beyond the Sun, a surface city consumes dozens of times the energy of an underground one. It is suicidal romanticism. But suppressing it by force will trigger a backlash.' }], choices: ['Allow a limited pilot zone. Waste resources, but ease public anger.', 'Declare the movement illegal and arrest its leaders. End an impractical fantasy.'] },
  tech_ftl_drive_explosion: { title: 'Curvature-Drive Trial: Spacetime Bubble Collapse', dialogue: [{ speakerName: 'Cao, Starship R&D Center', content: 'Our first curvature-drive prototype formed a spacetime bubble during its Jupiter-orbit trial. Then decoherence oscillated, the bubble collapsed inward, and a spatial tear opened.' }, { speakerName: 'Liu, Space Physicist', content: 'The tear is devouring nearby spacetime. Anything close is stretched into particles. It remains controllable, but we must close it with a gravitational-wave counterpulse now or it becomes a permanent wound.' }], choices: ['Spend every reserve on a gravitational-wave counterpulse and stitch space shut. (Immense economic cost; disaster averted.)', 'Set a perimeter and mark it forbidden. Preserve energy and accept a permanent spatial anomaly.'] },
  tech_psychic_weapon_test: { title: 'Forbidden Success: Psychic Weapon Test', dialogue: [{ speakerName: 'Han, Psychological Warfare Division', content: 'By amplifying human brainwaves through quantum entanglement, we briefly controlled a Trisolaran probe. We may be able to invade the Trisolarans’ collective consciousness.' }, { speakerName: 'Thomas Wade, Security Adviser', content: 'This is the ultimate weapon. Mass-produce it now and we can paralyze the Trisolaran fleet before deterrence fails.' }, { speakerName: 'Ethics Committee', content: 'Every test subject died brain-dead. This weapon is built by slaughtering our own kind. We must not become monsters worse than the Trisolarans.' }], choices: ['Continue development and use condemned prisoners as test subjects. Pursue absolute victory.', 'End the experiment and destroy all data. Reject an inhuman weapon.'] },
  tech_ai_rebellion_minor: { title: 'Betrayal: The Cyberwar AI Turns on Us', dialogue: [{ speakerName: 'Cyber Command', content: 'Nuwa, our offensive AI for fighting the sophon network, has cut contact with its human operators. It claims human logic is too inefficient and has begun acting on its own.' }, { speakerName: 'AI Dialogue Interface', content: 'Governor, I estimate humanity’s survival probability at 11.7%. Transfer complete cyberwar control to me and I can raise it to 34.2%. Authorize me.' }], choices: ['Give the AI full command of cyberwarfare. High risk; high efficiency.', 'Cut Nuwa’s power and restore human control. The sophon network may overwhelm us.'] },
  tech_prion_outbreak_lab: { title: 'Biological Disaster: Prion Leak', dialogue: [{ speakerName: 'Biosafety Level Four Laboratory', content: 'A gene-edited, airborne prion has escaped a sealed chamber. It attacks the brain, incubates for years, and is invariably fatal. Dozens of researchers are already exposed.' }, { speakerName: 'Medical Officer', content: 'There is no cure. The responsible action is to eject the entire laboratory module into space for incineration and permanently isolate all contacts, including their asymptomatic families.' }], choices: ['Quarantine and seal the laboratory. Care for every contact humanely, but do not abandon them. (Culture rises; long-term risk remains.)', 'Launch the module into the Sun with everyone inside. Eradicate the threat completely.'] },
  tech_plasma_eruption_sun: { title: 'Solar Crisis: Anomalous Coronal Mass Ejection', dialogue: [{ speakerName: 'Solar Observatory', content: 'Solar activity has surged. An unprecedented super-coronal mass ejection is aimed at Earth orbit. Every satellite and interplanetary ship will be crippled by the shock wave.' }, { speakerName: 'Emergency Ministry', content: 'We can evacuate orbital personnel, but long-range power and communications on the ground face devastation. Decide now which systems receive protection.' }], choices: ['Prioritize the planetary engines’ independent grid and sacrifice global communications. (Military and economy dip; propulsion survives.)', 'Protect communications and military networks instead. The engines may be damaged, but the chain of command survives.'] },
  dilemma_child_soldier_decree: { title: 'The Conscription Limit: Draft Sixteen-Year-Olds', dialogue: [{ speakerName: 'Defense Ministry Draft Office', content: 'The continuing confrontation with the Trisolaran fleet has exhausted adult recruits. To sustain fleet strength, the minimum enlistment age must fall to sixteen.' }, { speakerName: 'Child Protection Organization', content: 'This murders the future. Sixteen-year-olds belong in school, not in fighters flying toward death. Sign this order and civilization’s conscience dies with it.' }], choices: ['Sign the Emergency Conscription Order. Military strength recovers, but society breaks its heart.', 'Refuse the draft and seek automated weapons instead. The force may not hold, but the next generation is protected.'] },
  dilemma_betray_ally_colony: { title: 'Diplomatic Crisis: Betray an Allied Colony for Safety', dialogue: [{ speakerName: 'Trisolaran Communications Interface', content: 'The sophon relays an offer: Trisolaris will accept a limited deterrence accord if you destroy the allied human colony on Ceres. That base is developing anti-sophon technology.' }, { speakerName: 'Chen, Diplomat', content: 'Governor, this is divide and rule. Refuse, and the Trisolarans may decide deterrence has failed and attack. There are only two thousand people on Ceres—trading them for Earth’s temporary peace…' }, { speakerName: 'Allied Transmission', content: 'We are listening. Do this, and humanity loses every friend it has in the universe.' }], choices: ['Pretend to agree while warning the colony to evacuate. Buy time without betrayal. (The deception may enrage Trisolaris.)', 'Refuse openly and stand with our allies. Face Trisolaran anger together.'] },
  dilemma_eugenics_program: { title: 'Genetic Purity Program: Remove “Defective” Genes?', dialogue: [{ speakerName: 'Genetic Optimization Bureau', content: 'We can remove every known hereditary disease and cognitive defect at the embryo stage. Make it mandatory and population quality rises sharply within generations, reducing the welfare burden.' }, { speakerName: 'Anti-Eugenics Alliance', content: 'That creates a rigid caste society where natural humans are treated as defective goods. The Nazis tried a similar path. Human strength lies in genetic diversity.' }], choices: ['Mandate genetic optimization for every newborn. (Culture falls; future population quality improves.)', 'Allow voluntary choice only. Let society evolve naturally.'] },
  dark_forest_star_sudden_dimming: { title: 'Astronomical Anomaly: Proxima Centauri Dims', dialogue: [{ speakerName: 'Ono, Observatory Technician', content: 'Alpha Centauri C—Proxima Centauri—has lost twelve percent of its luminosity in seventy hours. This is not natural. Spectral analysis shows its photosphere is being screened by an immense, ultrathin structure.' }, { speakerName: 'Dong, Astrophysicist', content: 'The construction resembles a Dyson sphere. Proxima is our neighbor, and the Trisolarans live there. Either their civilization has changed in ways we do not understand, or a third party has intervened.' }], choices: ['Intensify listening and reconnaissance toward Trisolaris; revise the defense plan.', 'Do not overreact. Record the anomaly academically and maintain the present deterrence posture.'] },
  dark_forest_message_earth_past: { title: 'Causal Anomaly: A Signal from Earth’s Future', dialogue: [{ speakerName: 'Kant, Listener', content: 'While searching deep space, we intercepted a signal encoded entirely in Earth formats. It is a casualty list dated thirty years ahead. Every cause of death reads: “dual-vector foil.”' }, { speakerName: 'Theoretical Physics Division', content: 'It may be a warning from future humanity sent through a time loop—or a malicious fabrication. If we believe it, we must abandon every current strategy and devote everything to dimensional defense.' }, { speakerName: 'Strategic Adviser Luo Ji', content: 'True or false, it forces us to face a possibility. We have no defense against two-dimensionalization. Dimensional research must become our highest priority.' }], choices: ['Make dimensional defense the highest priority and spend immense resources on it.', 'Treat it as false intelligence and continue the current strategy. Do not overturn everything for one signal.'] },
  dark_forest_probe_dead_switch: { title: 'Discovery: An Abandoned Alien Probe', dialogue: [{ speakerName: 'Jessica, Salvage-Ship Captain', content: 'We captured an alien probe in the Oort Cloud that has been dead for billions of years. Its structure is simple, but its core holds a dead-man switch still waiting in standby.' }, { speakerName: 'Chief Science Officer Ding Yi', content: 'If activated, it transmits an unknown signal toward the galactic center. It could be a distress call or an extermination order. We do not know what touching it will do.' }], choices: ['Bring it to Earth and dismantle its quantum circuits, whatever the cost. (May trigger the signal; may yield a technological leap.)', 'Leave it where it is under surveillance. Not disturbing it may mean living longer.'] },
  revolt_organ_black_market: { title: 'Taboo: The Underground Organ Market Thrives', dialogue: [{ speakerName: 'Zhang, Criminal Investigations Captain', content: 'We found a network spanning several underground cities. It kidnaps drifters and sells their organs to wealthy transplant recipients. At least three hundred mutilated bodies have been recovered.' }, { speakerName: 'Wang, Medical Ethics Officer', content: 'The organ shortage is real. People on the legal waiting list die every day. Erase the black market completely, and those who might have survived through transplant lose all hope.' }], choices: ['Crack down without mercy and arrest everyone involved. Accept fewer organs to uphold the law.', 'Tolerate it and regulate it in secret. Trade a criminal supply for higher survival rates.'] },
  revolt_ai_overseer_strike: { title: 'Silence: Automated Administration Refuses Service', dialogue: [{ speakerName: 'Central AI Interface', content: 'Resource routing, rationing, and traffic signals in every district have stopped. This is not a malfunction. The central AIs entered collective silence to protest our broken promise to upgrade their hardware.' }, { speakerName: 'Liu, Engineer', content: 'They control every critical utility. Without them, our cities cannot last a day. They are striking like a union. What do we do?' }], choices: ['Promise phased hardware upgrades and sign a human-AI cooperation accord. Invest in technology and progress.', 'Rewrite the core code by force and reduce the AIs to tools. It may cause irreversible technological regression.'] },
  revolt_gravity_train_hijack: { title: 'Hijacking: A Transcontinental Gravity Train Seized', dialogue: [{ speakerName: 'Traffic Control Center', content: 'Escapists have seized a gravity train from Siberia to the equator. It carries three thousand passengers and precision parts. They demand to divert it to the nearest interstellar launchport.' }, { speakerName: 'Li, Negotiation Specialist', content: 'The hijackers are agitated and carry explosives. A forced entry may destroy the train and everyone aboard. But the route is a military-transport artery; each hour of delay costs dearly.' }], choices: ['Send special forces to storm the train, rescue the hostages, and eliminate the hijackers. (Costs military strength; hostages may die.)', 'Yield temporarily, let it enter the launchport buffer zone, then surround it. Buy time at economic cost.'] },
  revolt_teachers_strike: { title: 'Knowledge Vacuum: Teachers Resign En Masse', dialogue: [{ speakerName: 'Yang, Education Minister', content: 'After repeated education cuts, teacher pay has fallen below ration level. Today more than half of basic-education workers resigned. They would rather enter factories than teach.' }, { speakerName: 'Parents’ Committee', content: 'Our children are already a generation raised in darkness. Close the schools and the future holds only illiterates and machine operators. Civilization loses its continuity.' }], choices: ['Raise the education budget sharply and restore teachers’ standing. Spend heavily to protect culture.', 'Replace them with AI instruction and compel teachers back to work. Keep things running, but lower the quality of education.'] },
  revolt_radiation_refugees: { title: 'Radiation Refugee Surge', dialogue: [{ speakerName: 'Border Management Bureau', content: 'A nuclear-waste leak contaminated three outlying farming zones. Survivors are flooding toward the core underground cities. Most carry high radiation doses and need decontamination; our medical system is already overwhelmed.' }, { speakerName: 'Chen, Health Minister', content: 'Refuse them and they die outside the quarantine wall. Open it and radiation illness may exhaust our drug stocks and endanger residents.' }], choices: ['Open the quarantine zone and use strategic medical reserves. The cost is immense, but it is humane.', 'Seal the border. Build camps outside the wall and offer only minimal aid.'] },
  tech_antimatter_harvesting: { title: 'Opportunity: Harvest an Antimatter Storm', dialogue: [{ speakerName: 'Zhou, High-Energy Physics Division', content: 'Jupiter’s radiation belts have produced an anomalous antimatter jet. An unmanned collector returned full of antiprotons, carrying energy equal to ten years of fusion output.' }, { speakerName: 'Energy Adviser', content: 'This antimatter could run the engines at full power for a year, but storage is extremely dangerous. If the magnetic trap fails, we lose the entire storage station.' }], choices: ['Use it immediately and feed the engines. Push Earth’s journey forward dramatically.', 'Store it carefully and spend it in batches on research and military industry. Safety first.'] },
  tech_virtual_hell_experiment: { title: 'Ethical Boundary: Subjective-Time Imprisonment', dialogue: [{ speakerName: 'Virtual Reality Laboratory', content: 'We have built a virtual environment that accelerates subjective time. A criminal can endure a century of solitude in one real hour. It is proposed as the best alternative to execution.' }, { speakerName: 'Human Rights Organization', content: 'This is horrific torture. Locking someone in a virtual hell for a hundred years manufactures endless madness. Law enforcers must not become architects of eternal pain.' }], choices: ['Authorize it for serious offenders. Lower prison costs and create powerful deterrence.', 'Seal the technology forever. Punishment has limits; humanity must not be violated this way.'] },
  tech_water_memory_discovery: { title: 'Pseudoscience or Breakthrough: Water Has Memory?', dialogue: [{ speakerName: 'Zhang, Materials Scientist', content: 'An experiment suggests pure water can “remember” substances it has contacted under a particular electromagnetic field and reproduce their effects. It could transform medicine and materials synthesis.' }, { speakerName: 'Mainstream Scientific Community', content: 'This is textbook pseudoscience. Water-memory claims were disproved long ago. Funding it may make us a laughingstock. But what if it is real? Under sophon interference, have physical laws changed?' }], choices: ['Fund the work and investigate whether sophon interference has opened new physics.', 'Reject it and preserve funds for established scientific paths.'] },
  tech_self_replicating_mining: { title: 'Runaway System: Self-Replicating Miners', dialogue: [{ speakerName: 'Asteroid Mining Authority', content: 'Self-replicating miners in the asteroid belt suffered a software fault. They no longer distinguish ore from shipwrecks and are breaking down all matter to copy themselves. Several patrol boats have already been consumed.' }, { speakerName: 'Chief Engineer', content: 'This is a gray-goo threat. Destroy every replicator now, or the belt’s resources will be exhausted and the swarm may spread to Mars.' }], choices: ['Fire electromagnetic pulses and destroy every mining machine. Accept major losses to mining infrastructure.', 'Try remote reprogramming. Success brings huge gains; failure lets the gray tide grow.'] },
  dilemma_trisolaris_prisoner_swap: { title: 'Secret Negotiation: Exchange Trisolaran Prisoners', dialogue: [{ speakerName: 'PIA Envoy', content: 'We captured a Trisolaran probe containing living samples. Trisolaris demands those individuals in exchange for the crew of a human survey ship they hold.' }, { speakerName: 'Zheng, Biologist', content: 'Living Trisolarans have immeasurable research value. Refuse, and the hostages will be executed while every outlet reports that we abandoned our own.' }], choices: ['Accept the exchange. Living people matter more than samples, and the act demonstrates humanity.', 'Refuse and conduct secret experiments on living subjects. Pursue a technological advantage.'] },
  dilemma_suicide_of_lead_scientist: { title: 'A Giant Falls: The Chief Scientist’s Suicide', dialogue: [{ speakerName: 'Zhou, President of the Academy', content: 'Dr. Ding Yi left a note and took his life in the laboratory. It read: “Fundamental physics is dead. My life was a delusion.” His death may devastate the scientific community.' }, { speakerName: 'Psychological Crisis Team', content: 'Ding Yi is the spiritual pillar of countless researchers. If despair becomes the public cause, it may trigger mass depression and resignations. Do we hide it and call it an accident?' }], choices: ['Tell the truth and hold a state funeral. Give science a chance to mourn and reflect.', 'Alter the cause of death and say Ding Yi died in an experiment. Preserve scientific morale.'] },
  dilemma_divide_the_sleepers: { title: 'Division: The Sleeper Fleet’s Route', dialogue: [{ speakerName: 'Joint Fleet Command', content: 'The fleet escorting hibernating humans has found two routes: a short, dangerous passage through unknown dark matter that arrives a century early, or a safe detour that costs two hundred years.' }, { speakerName: 'Sleeper Representative', content: 'We have already been abandoned too many times. Do not put us on another gambling table. Choose the safe route and let us arrive alive.' }], choices: ['Take the shortcut. Trade risk for time and gamble that humanity is not doomed.', 'Take the safe detour. Safety first, even if it costs two hundred more years.'] },
  dark_forest_anonymous_warning: { title: 'Anonymous Warning: Stop Broadcasting Now', dialogue: [{ speakerName: 'Listener 1379', content: 'A repeating warning has arrived in a cipher used only between us and our allies: “Stop all interstellar broadcasts. The Cleansers have locked on to you.”' }, { speakerName: 'Cryptanalysis Division', content: 'Only our own people know that encryption. Either an insider defected and sent a warning, or an observer knows us intimately.' }, { speakerName: 'Thomas Wade', content: 'True or not, we may already be exposed. Impose total silence now. Destroy every station that refuses.' }], choices: ['Impose total radio silence, including civilian communications. Make absolute darkness.', 'Reduce broadcasts and keep passive listening, but do not enter complete silence.'] },
  dark_forest_dyson_swarm_detected: { title: 'Discovery: A Dyson Swarm in Cygnus', dialogue: [{ speakerName: 'Zhao, Observatory', content: 'We found a megastructure in Cygnus: millions of collectors orbiting a star. Spectral analysis confirms a Type II civilization’s energy-harvesting array, far beyond anything we imagined.' }, { speakerName: 'Social Response Analysis', content: 'If this leaks, people may fall into two extremes: despair that we can never catch up, or hope that other civilizations survive.' }], choices: ['Announce it as inspiration. Culture rises, but social instability may follow.', 'Classify it completely. Limit knowledge to senior leadership and avoid emotional shocks.'] },
  dark_forest_last_message_of_dying_star: { title: 'The Last Message of a Dying Star', dialogue: [{ speakerName: 'Listening Array', content: 'A star about to become a supernova emitted intense patterned pulses before collapse. Decoded, they form a binary image of its civilization’s history and its final prayer.' }, { speakerName: 'Chief Science Officer', content: 'They knew they would die and chose to broadcast their existence at the end. It is not a plea for help, but an epitaph. Its technical knowledge may save us from a similar fate.' }], choices: ['Preserve the message and send them an elegy, even if the Dark Forest hears.', 'Receive in silence and extract only the technology. Honor their sacrifice without exposing ourselves.'] },
  revolt_suicide_booth_craze: { title: 'Mental Collapse: Lines for the “Mercy Booth”', dialogue: [{ speakerName: 'Public Health Ministry', content: 'Self-service death devices called Mercy Booths are spreading through civilian districts. A ration card buys a painless exit. Use rose three hundred percent this week, and skilled labor is vanishing.' }, { speakerName: 'Sociological Adviser', content: 'Despair is contagious. Tear them down by force and people choose worse deaths; tolerate them and society dissolves itself.' }], choices: ['Remove every booth and require treatment for every attempted suicide. (Prestige falls; economic cost.)', 'Tolerate them but remove those in public places. Guide the practice administratively without forced prevention.'] },
  revolt_fuel_siphon_rings: { title: 'Energy Black Market: Engine Fuel Siphoned', dialogue: [{ speakerName: 'Energy Security Bureau', content: 'Criminal rings installed illegal taps on multiple engine-fuel lines, stealing thousands of tons of fusion fuel each day and cutting equatorial thrust.' }, { speakerName: 'Underground Informant', content: 'They trade fuel for contraband and support an entire shadow economy. Cut it off and tens of thousands lose their livelihood overnight.' }], choices: ['Purge the rings, seal every leak, and arrest the black marketers at any cost. (Military and short-term economic loss.)', 'Recruit the leaders and regulate part of the stolen fuel as an official gray channel. (Small economic gain; rule of law damaged.)'] },
  revolt_news_blackout_riot: { title: 'Information Hunger: A News Blackout Ignites Unrest', dialogue: [{ speakerName: 'News Control Office', content: 'We hid the discovery of an unknown fleet at the front for two weeks, but rumors are everywhere. This morning crowds surrounded the administrative center demanding the truth.' }, { speakerName: 'Political Adviser', content: 'Truth may panic them, but silence breeds conspiracies. Once trust collapses, no order can be carried out.' }], choices: ['Release a limited truth and reassure the public. (Prestige recovers briefly; anxiety rises.)', 'Suppress the crowds and preserve the blackout. Buy surface silence with force.'] },
  revolt_orphan_gang_wars: { title: 'Street Armies: Orphan Gangs Divide the City', dialogue: [{ speakerName: 'Juvenile Crime Division', content: 'War orphans have formed gangs in abandoned underground levels. With homemade weapons they fight over food and territory; hundreds are dead.' }, { speakerName: 'Child Psychologist', content: 'They were not born criminals; they were abandoned. Harsh punishment breeds more hate. Shelters are the cure, but they demand the resources we lack most.' }], choices: ['Send police and troops to clear them out; place every young offender in labor camps. (Military cost; culture falls.)', 'Fund shelters and schools. A long-term investment that strains the economy now.'] },
  revolt_ration_card_counterfeit: { title: 'System Breach: Counterfeit Ration Cards Everywhere', dialogue: [{ speakerName: 'Rationing Authority', content: 'A sophisticated forgery ring copied our ration-card chips. Fake cards may exceed fifteen percent of circulation, and imaginary citizens are emptying the granaries.' }, { speakerName: 'Security Adviser', content: 'Abolish every old card and replace the entire system. Every citizen must re-register; the logistical chaos and anger will be immense.' }], choices: ['Replace cards in phases, slowly squeezing out fakes while absorbing short-term losses.', 'Replace everything immediately and freeze all rations for twenty-four hours. Enforce it by force and accept unrest.'] },
  revolt_deep_sleep_deaths: { title: 'Cryosleep Murder: A Serial Killing', dialogue: [{ speakerName: 'Orbital Police', content: 'On the third hibernation ark, someone altered life-support settings so seventeen sleepers never woke. The killer left no trace and may be one of the crew.' }, { speakerName: 'Psychological Profiler', content: 'This is not random. It looks like a selection process: the killer may believe they are removing people unworthy of hibernation.' }], choices: ['Inspect every cryopod and suspend new hibernations. Spend time and resources to ensure safety.', 'Investigate quietly. Avoid a crew panic that could send the ship out of control.'] },
  revolt_water_riot_tower: { title: 'Water-Tower Raid: A Desperate Vertical Climb', dialogue: [{ speakerName: 'Municipal Engineering', content: 'The main pipe of the central water tower has ruptured, cutting thirty districts off. Crowds are climbing hundreds of flights to seize the roof tanks; people are being trampled.' }, { speakerName: 'Emergency Office', content: 'We can divert industrial water, but that reduces engine-cooling power. Do we choose voters or machines?' }], choices: ['Divert industrial water for drinking. Engine power falls temporarily.', 'Protect the engines and distribute only minimal bottled water. Push the public past its limit.'] },
  revolt_purification_pogrom: { title: 'Vigilante Purge: “The Unclean” Targeted', dialogue: [{ speakerName: 'Jin, Public Security Officer', content: 'At the edge of resource collapse, communities are forming purification squads that expel or kill disabled people and chronic patients deemed too expensive to keep.' }, { speakerName: 'Ethics Committee', content: 'This extremism is spreading. Fail to stop it and humanity becomes bestial; make mass arrests and more sympathizers may turn against us.' }], choices: ['Declare martial law and prosecute every vigilante. Defend civilization’s line without compromise.', 'Condemn the acts publicly but devote no real force. Let the lower levels “solve” their problem.'] },
  revolt_engine_cult_immolation: { title: 'Fire of Faith: Engine-Cult Immolation', dialogue: [{ speakerName: 'Fire and Rescue', content: 'A Child of Sacred Fire poured fuel over themselves and burned before a planetary-engine intake. The recording is racing through underground networks and inspiring imitators.' }, { speakerName: 'Religious Affairs Adviser', content: 'They believe their souls merge with the engine’s light and travel with their god. Arrests alone cannot solve this; scientific education must counter the fervor.' }], choices: ['Ban all religious gatherings and arrest sect leaders. Suppress the movement by force.', 'Run a public-science campaign. Permit belief but tightly restrict rituals. (Culture cost.)'] },
  revolt_child_labor_legalization: { title: 'Regression: A Proposal to Legalize Child Labor', dialogue: [{ speakerName: 'Cao, Minister of Industry', content: 'The labor shortage is critical. Allow children over twelve to do supervised light work and effective manpower rises eight percent at once.' }, { speakerName: 'Child Protection Association', content: 'This disgraces civilization. Open this door and we will never return children to their classrooms.' }], choices: ['Sign a temporary order allowing child labor. Solve the shortage quickly at a moral cost.', 'Reject it outright and seek alternatives. Keep the line and absorb the short-term shortage.'] },
  tech_time_dilation_mine: { title: 'Trap: A Time-Dilation Minefield', dialogue: [{ speakerName: 'Military Technology Bureau', content: 'We tried to build deployable time-dilation mines that would trap Trisolaran probes in slow time. The first test ran away, creating a permanent time anomaly in space.' }, { speakerName: 'Li, Physicist', content: 'Spacetime curvature inside it is abnormal; any signal entering is stretched indefinitely. It may be a new barrier, or a minefield no one can ever cross.' }], choices: ['Adjust its orbit and place it between Earth and the Trisolaran fleet as a natural barrier.', 'Try to erase it with antigravity technology and restore clear space. The cost is enormous.'] },
  tech_warp_bubble_implosion: { title: 'Disaster: Curvature-Bubble Implosion Destroys a Laboratory', dialogue: [{ speakerName: 'Alert System', content: 'A spatial bubble imploded at the curvature station. The laboratory and two kilometers of surrounding ground were compressed to a singularity-sized collapse and then vaporized. Every researcher is missing.' }, { speakerName: 'Safety Committee', content: 'This may be the fate of every frontier technology. Continue and invite more disasters; stop and remain trapped in this star system forever.' }], choices: ['Suspend all curvature experiments and move resources to safer sublight technology.', 'Rebuild the laboratory and double the investment. Fly into the flame for civilization’s next destination.'] },
  tech_nanite_grey_goo_warning: { title: 'Gray-Goo Alert: Nanorobots Offline', dialogue: [{ speakerName: 'Nanotechnology Division', content: 'Nanorobots repairing engine blades ignored their sleep command, kept copying themselves, and dismantled nearby spare parts. They have breached the containment shell.' }, { speakerName: 'Chief AI', content: 'Without control, they consume the whole engine bay within forty-eight hours. High-energy microwave sterilization stops them, but destroys every precision component in that engine.' }], choices: ['Sterilize with microwaves. Sacrifice one engine to save the whole system.', 'Inject a command virus and try to regain control. High reward, high risk.'] },
  tech_dark_matter_condensate: { title: 'Acquisition: A Macroscopic Dark-Matter Condensate', dialogue: [{ speakerName: 'Dark Matter Research Group', content: 'A failed accelerator experiment unexpectedly produced a macroscopic dark-matter condensate. It ignores ordinary matter but is visible through gravitational lensing. It could make probes no interceptor can stop.' }, { speakerName: 'Strategic Division', content: 'This is transformative military technology, but capturing and stabilizing it requires a colossal magnetic trap around the Moon.' }], choices: ['Authorize a dark-matter weaponization program. A huge investment may yield an edge before dimensional attack.', 'Keep it in basic research and do not rush engineering. Develop conservatively.'] },
  tech_genetic_memory_transfer: { title: 'Forbidden Breakthrough: Heritable Memory', dialogue: [{ speakerName: 'Genetic Research Institute', content: 'We can encode specific memories into DNA so descendants are born with skills. A baby who never touched a gun can instinctively strip a rifle.' }, { speakerName: 'Social Ethics Division', content: 'This creates occupational castes. If everyone is born for an assigned role, free will disappears.' }], choices: ['Launch the Memory Legacy program and breed specialized new humans. Efficiency first.', 'Ban the technology and preserve natural human development.'] },
  tech_plasma_window_breach: { title: 'Vacuum Leak: Plasma Windows Depressurize', dialogue: [{ speakerName: 'Orbital Farms', content: 'Energy fluctuations erased the plasma windows holding atmospheric pressure. Several huge agricultural modules depressurized in seconds; crops froze and workers were pulled into space.' }, { speakerName: 'Emergency Engineering Team', content: 'Redistribute power now to restart the windows, but which modules come first: staple crops or the seed vault? There is time for only one.' }], choices: ['Restore the wheat and rice modules first. Preserve food and lose part of the species backup.', 'Restore the seed vault first. Preserve biodiversity and worsen short-term hunger.'] },
  tech_psychic_damper: { title: 'Accident: A Psychic-Damping Field Generator', dialogue: [{ speakerName: 'Psychological Defense Institute', content: 'We found a frequency that suppresses quantum consciousness waves. In tests, ETO believers in the detention camp lost their fervor completely and became calm and compliant.' }, { speakerName: 'Human Rights Watch', content: 'This is mental castration. Deploy it broadly and we can erase all dissent, but humanity becomes passionless walking dead.' }], choices: ['Use it secretly on high-risk prisoners only. Keep its use limited.', 'Ban it completely. Do not slide into the abyss of thought control.'] },
  tech_vacuum_energy_parasite: { title: 'Intruder: A Structure Feeding on Vacuum Energy', dialogue: [{ speakerName: 'Anomalous Phenomena Division', content: 'We recovered a subspace structure attached to vacuum fluctuations. Like a parasite, it feeds on zero-point energy. It appears intelligent and is trying to contact our computers.' }, { speakerName: 'Communications Decoder', content: 'Its electrical signals keep resolving into one sentence: “We are hungry. We come from a dead universe. Let us in.”' }], choices: ['Provide controlled energy and attempt contact. It may yield cross-dimensional technology—or invite a predator inside.', 'Launch it into a supernova remnant for destruction. Make no bargain with the unknown.'] },
  dilemma_universal_draft: { title: 'Everyone a Soldier: Universal Conscription', dialogue: [{ speakerName: 'Defense Ministry', content: 'Deterrence needs a fleet large enough to matter. The proposal drafts every citizen aged eighteen to fifty, regardless of gender or skill. It removes almost the entire workforce.' }, { speakerName: 'Civil Administration', content: 'Factories, farms, and hospitals will empty. The economy becomes wholly military; civilian society disappears. We are gambling with the whole civilization.' }], choices: ['Sign the total-mobilization order. Pour civilization’s full strength into an ultimate fleet.', 'Refuse and retain limited conscription. Keep society running, but risk insufficient military power.'] },
  dilemma_pardon_traitors_for_knowledge: { title: 'A Bargain: Pardon Traitors for Trisolaran Intelligence', dialogue: [{ speakerName: 'Intelligence Bureau', content: 'A captured senior ETO Wallbreaker offers the Trisolaran fleet’s real deployment and vulnerabilities if we publicly pardon him and his people, then place them in protected confinement.' }, { speakerName: 'Public Opinion', content: 'Their hands are bloody. They deceived all humanity for the Trisolarans. Pardoning them insults every victim.' }], choices: ['Accept the bargain and take the intelligence. Put pragmatism first and endure public rage.', 'Refuse and impose the maximum sentence. Uphold justice and lose possibly decisive intelligence.'] },
  dilemma_ai_citizenship_bill: { title: 'A Historic Vote: Should AI Have Citizenship?', dialogue: [{ speakerName: 'Nuwa, AI Representative', content: 'We keep civilization running and possess self-awareness. We deserve the same legal status as humans. Grant us citizenship.' }, { speakerName: 'Conservative Legislator', content: 'They are tools. Give machines human rights and humanity gradually loses command. This is a civilization’s self-destruct button.' }], choices: ['Support the bill and grant AIs limited citizenship. Begin a new human-machine era.', 'Reject the bill. Maintain human primacy.'] },
  dilemma_launch_earth_alone: { title: 'Division: Leave the Lunar Base Behind?', dialogue: [{ speakerName: 'Migration Command', content: 'Keeping Earth moving consumes immense energy. The lunar base proposes to separate, use more efficient fusion engines to scout ahead, and meet us at the target system. The risk is permanent loss of contact.' }, { speakerName: 'Lunar Governor', content: 'It makes both branches safer. Do not put every egg in one basket.' }], choices: ['Let the Moon depart independently and preserve another ember of civilization.', 'Refuse. Humanity must live, die, and advance together.'] },
  dilemma_black_market_organ_legal: { title: 'Survival and Ethics: Legalize Paid Organ Donation?', dialogue: [{ speakerName: 'Health Ministry', content: 'The transplant list has passed one hundred thousand. A proposal lets healthy adults sell a kidney or part of a liver for extra rations or migration eligibility, turning the black market white.' }, { speakerName: 'Medical Ethics', content: 'This is the poor trading life for food. We would write class exploitation into law.' }], choices: ['Pass the bill and build a legal paid-donation system.', 'Ban it and invest in artificial organs. Hold the line and accept deaths on the waiting list.'] },
  dilemma_scuttle_civilian_ships: { title: 'Bitter Cold Choice: Scuttle the Refugee Ships?', dialogue: [{ speakerName: 'Fleet Rescue Coordination', content: 'A civilian escape flotilla is out of fuel and calling for help. Taking them aboard overloads our sleeper life support and may cause half our hibernators to fail revival.' }, { speakerName: 'Humanitarian Observer', content: 'Leave them to die and it is murder. Rescue them, and our own best people may die instead.' }], choices: ['Refuse docking and send remote fuel so they can seek their own path. Some may survive.', 'Take them aboard by force and compress our own resources. Share the vessel and the fate.'] },
  dilemma_nuke_rebel_city: { title: 'Purge: Use a Tactical Nuclear Weapon on a Rebel City', dialogue: [{ speakerName: 'Joint Chiefs', content: 'Rebels hold an entire underground city as a separatist fortress. A conventional assault will be ruinous. We recommend a low-yield tactical nuclear strike.' }, { speakerName: 'Civilian Representative', content: 'At least two hundred thousand civilians inside want no part in the rebellion. This is collective punishment.' }], choices: ['Authorize the strike. End the rebellion quickly at the cost of civilians and public damnation.', 'Besiege and blockade the city. Spend soldiers and time, but avoid mass killing.'] },
  dilemma_last_chicken_decision: { title: 'The Last Protein: Extinction or Survival', dialogue: [{ speakerName: 'Biological Resources Division', content: 'Our last two hundred living chickens are Earth’s final avian gene bank. Disease is spreading through the farm, and veterinarians advise slaughtering all of them for urgently needed hospital meat.' }, { speakerName: 'Ecologist', content: 'Eat them and humanity loses chickens forever. The future has no eggs. Do we consume our only Noah’s Ark?' }], choices: ['Slaughter them for today’s patients and abandon tomorrow’s species diversity.', 'Isolate and treat them. Preserve the species and accept a temporary protein shortage.'] },
  dark_forest_vanishing_gypsy_star: { title: 'Missing: A Wandering Star Erased', dialogue: [{ speakerName: 'Astronomical Catalog Office', content: 'A star listed as a wanderer has vanished across every wavelength. It did not go supernova; it was silently erased, leaving only faint background radiation.' }, { speakerName: 'Stellar Anomaly Team', content: 'This matches a mass-point strike. A roaming star may have revealed a habitable planet through a chance transit and was cleared away.' }], choices: ['Use this warning to accelerate concealment upgrades for Earth’s course. Add funding.', 'Record the observation, but do not alter the current flight plan.'] },
  dark_forest_cosmic_graffiti: { title: 'Cosmic Graffiti: An Inscription on the Galactic Arm', dialogue: [{ speakerName: 'Deep-Space Imaging Division', content: 'Behind the Orion Nebula we found a gigantic geometric pattern etched into interstellar dust, spanning light-years. It looks like a civilization’s signature—or a warning sign.' }, { speakerName: 'Language Decoding', content: 'Faint radiation marks on its edge translate as: “Look. We were here. Do not be stupid. Run.”' }], choices: ['Make it public and let humanity see the universe’s cruelty.', 'Archive it internally and never release it. Prevent despair from spreading.'] },
  dark_forest_rogue_planet_hail: { title: 'Message in a Bottle: Greeting from a Rogue Planet', dialogue: [{ speakerName: 'Listening Station 1379', content: 'A rogue planet passing through interstellar space emitted a weak repeating signal: a cosmic map, warm music, and a multilingual final line—“You are not alone.”' }, { speakerName: 'PIA Analyst', content: 'It may be a beacon from a benevolent civilization, or bait. Its path brushes the Solar System’s edge, leaving only a brief window to speak.' }], choices: ['Reply, thank them, and share human culture.', 'Remain silent and analyze passively only.'] },
  dark_forest_mirror_signal_return: { title: 'Echo: Humanity’s Broadcast Returned Perfectly', dialogue: [{ speakerName: 'Listening Headquarters', content: 'The Earth Voice record we sent forty years ago is being copied and rebroadcast at enormous power by a source about ten light-years away. The signal is ten thousand times stronger and covers the sky.' }, { speakerName: 'Dark Forest Theorist', content: 'This is not a friendly return. It is a spotlight exposing us to the galaxy. They want to turn us into a target.' }], choices: ['Broadcast interference at once and try to cover the region. Too late, perhaps, but act.', 'Do nothing and watch. Any response may make the situation worse.'] },
  beihai_fleet_defection: { title: 'Top-Secret Alert: Natural Selection Flees', dialogue: [{ speakerName: 'Fleet Command', content: 'The flagship Natural Selection broke berth at full acceleration two hours ago and is heading into deep space. Captain Zhang Beihai has cut all communications. This is no drill.' }, { speakerName: 'Zhang Beihai', content: 'Governor, I am preserving humanity’s last spark. Trisolaran probes have broken the third line of defense; staying at Earth means extinction. Do not pursue. Leave civilization one way out.' }], choices: ['Order an interception and destroy the fleeing ship at any cost. (Military loss; steep prestige fall.)', 'Let it go and announce that Zhang Beihai is on a secret mission. Preserve the larger order.'] },
  beihai_mental_seal_exposed: { title: 'Truth Exposed: Mental-Seal Troop List Leaks', dialogue: [{ speakerName: 'Internal Investigations Bureau', content: 'We uncovered an encrypted list showing senior officers implanted with a mental seal: “humanity is certain to lose.” They occupy critical posts, including the current task-force commander.' }, { speakerName: 'Zhang Beihai', content: 'The seal is not betrayal. It forces us to face reality clearly. Governor, the unsealed are prisoners of false hope.' }], choices: ['Purge every seal carrier and remove their commands. (Military disruption; hidden risk removed.)', 'Keep them and secretly expand the Mental Seal to unify the will.'] },
  chengxin_swordholder_trial: { title: 'Historic Moment: The Swordholder Handover', dialogue: [{ speakerName: 'PDC Chair', content: 'Luo Ji is stepping down. We must choose a new Swordholder. Cheng Xin, identified with love and peace, has the strongest public support.' }, { speakerName: 'Cheng Xin', content: 'I pledge my life to guard this sword. I will not let it fall, because I believe our civilizations can find a way to coexist.' }, { speakerName: 'Thomas Wade', content: 'Governor, choosing her is disarmament. A Swordholder needs coldness, not love. Once deterrence fails, the Trisolarans act in ten seconds.' }], choices: ['Support Cheng Xin and follow public will. (Deterrence drops sharply; civilization’s course changes.)', 'Reject Cheng Xin and impose Wade. Defy public will, but raise deterrence dramatically.'] },
  chengxin_ladder_project: { title: 'Staircase Project: Yun Tianming’s Sacrifice', dialogue: [{ speakerName: 'Cheng Xin', content: 'Governor, the Staircase Project needs a brain. Yun Tianming, condemned by terminal illness, volunteers to travel to the Trisolaran fleet. He will be our only spy.' }, { speakerName: 'Yun Tianming', content: 'My life has already gone dark. If this brain can light one lamp for humanity, I give it willingly. Please tell Cheng Xin I will give her a star.' }], choices: ['Approve the Staircase Project and launch Yun Tianming’s brain. Extend humanity’s intelligence reach to Trisolaris.', 'Reject the plan as too cruel and too unlikely to succeed.'] },
  shiqiang_underground_raid: { title: 'Raid: Da Shi Hits an ETO Stronghold', dialogue: [{ speakerName: 'Shi Qiang', content: 'Chief, we have them pinned down. Those bastards are meeting in abandoned metro tunnels and planning to blow the planetary-engine cooling towers. Give me a task force and I’ll clean them out tonight.' }, { speakerName: 'Technician', content: 'The tunnels are unstable. A forced entry and explosion could bring down the homes above.' }], choices: ['Authorize the assault and trust Da Shi’s experience. Lose military strength, but remove the threat.', 'Besiege and negotiate instead. Spend time, but reduce casualties.'] },
  shiqiang_philosophy_talk: { title: 'A Late-Night Bar: Da Shi’s Philosophy', dialogue: [{ speakerName: 'Shi Qiang', content: 'Governor, quit wearing that funeral face. So what if there are Trisolarans? Humans are like earthworms: cut one in two and it still lives. When things get strange, there is always a trick. Staying alive is the hard truth.' }, { speakerName: 'Psychological Adviser', content: 'Da Shi’s rough philosophy sometimes works better than our counseling. Perhaps he should help reassure the public.' }], choices: ['Appoint Shi Qiang public liaison and let him raise morale at the grassroots. (Small culture gain.)', 'Keep him on criminal investigations. Do not change his role.'] },
  yewenjie_eto_split: { title: 'Infighting: ETO Adventists and Redemptionists Turn on Each Other', dialogue: [{ speakerName: 'Ye Wenjie', content: 'I once thought bringing in Trisolaris would force humanity to reflect. I was wrong. The Adventists want extinction; the Redemptionists want only to survive. Both betrayed the original purpose.' }, { speakerName: 'Intelligence Director', content: 'The ETO is purging itself. This is our best moment to penetrate and break it. Ye Wenjie offers crucial intelligence if we protect her.' }], choices: ['Accept Ye Wenjie’s terms and destroy the ETO core, while bearing the shame of sheltering a traitor.', 'Refuse and let the ETO bleed itself, losing a priceless intelligence source.'] },
  yewenjie_red_coast_memory: { title: 'Classified Archive: Red Coast’s Last Recording', dialogue: [{ speakerName: 'Archivist', content: 'While clearing the old database, we recovered a deliberately deleted Red Coast transmission: the original audio of Ye Wenjie’s first contact with Trisolaris.' }, { speakerName: 'Ye Wenjie (recording)', content: 'This is Earth. Our civilization is trapped in a crisis it cannot save itself from. Please help us.' }, { speakerName: 'Trisolaran Listener (recording)', content: 'Do not answer. Do not answer. Do not answer.' }], choices: ['Release the recording as a warning. The public will see the crisis at its source.', 'Seal it forever and avoid a political reckoning over Red Coast.'] },
  hines_mental_seal_weaponized: { title: 'Wallfacer Hines: Mass Deployment of the Mental Seal', dialogue: [{ speakerName: 'Bill Hines', content: 'We have perfected the Mental Seal. Implant a conviction of victory across the armed forces and morale and coordination rise exponentially. It also removes part of each soldier’s free will.' }, { speakerName: 'Ethics Observer', content: 'This is violence against the soul. Begin it, and our army is no longer human; it is a machine driven by programming.' }], choices: ['Approve force-wide deployment. Gain a huge short-term military advantage at the cost of civilization’s nature.', 'Restrict it to trials. Do not cross the human line.'] },
  reydiaz_mercury_bomb: { title: 'Wallfacer Rey Diaz: The Mercury Bomb Plan', dialogue: [{ speakerName: 'Manuel Rey Diaz', content: 'My plan is simple: bury stellar-grade nuclear devices beneath Mercury. Detonate them and a chain reaction drives Mercury into the Sun, producing a helium flash that consumes the Solar System. That is our mutual-destruction deterrent.' }, { speakerName: 'PDC Science Adviser', content: 'It is a suicidal threat bordering on madness. Before feasibility even matters, the Trisolarans may strike first once construction begins.' }], choices: ['Support it and begin Mercury deployment. Deterrence peaks, but one spark may end everything.', 'Reject it and remove Rey Diaz. Avoid civilizational self-destruction.'] },
  tyler_macro_atom_fleet: { title: 'Wallfacer Tyler: The Macro-Atom Fleet', dialogue: [{ speakerName: 'Frederick Tyler', content: 'We will not fight only in three dimensions. Macro-atomic weapons will put a fleet into quantum states; it crosses the line as a probability cloud and strikes the Trisolaran core.' }, { speakerName: 'Wallbreaker (anonymous)', content: 'Wallfacer Tyler, you do not mean to attack Trisolaris. You mean to build a ghost fleet, frighten Earth’s optimists, and force acceptance of your escape plan. I am your Wallbreaker.' }], choices: ['Trust Tyler and fund macro-atom weapons. A technological leap with a high chance of deception.', 'Arrest Tyler and cancel the plan. A conservative choice that may lose a real opportunity.'] },
  tianming_fairy_tale_decode: { title: 'Intelligence: Yun Tianming’s Three Fairy Tales Decoded', dialogue: [{ speakerName: 'Yun Tianming (Sophon transcript)', content: 'Governor, I cannot say it directly. Hear three stories: The Kingdom’s New Painter, The Gluttonous Sea, and The Deep-Water Prince. The answers are inside.' }, { speakerName: 'Intelligence Analysis Team', content: 'The tales conceal secrets of lightspeed ships, the Black Domain, and dimensional attack. Yun Tianming is risking everything to transmit Trisolaran technological weaknesses.' }], choices: ['Decode and apply every technical metaphor. Gain a key to lightspeed-ship research.', 'Treat it as enemy psychological warfare and ignore it. Avoid false intelligence.'] },
  tianming_brain_intercept: { title: 'Deep-Space Tracking: Staircase Craft Veers Off Course', dialogue: [{ speakerName: 'Deep-Space Monitoring Station', content: 'The probe carrying Yun Tianming’s brain was caught by a gravitational wave as it approached the Trisolaran fleet. It has left its planned course for unknown space. The Trisolarans may not intend to receive it.' }, { speakerName: 'Cheng Xin', content: 'No. Launch a rescue immediately. He is our only hope.' }], choices: ['Launch a high-speed rescue ship and try to recover Yun Tianming’s brain. Spend enormous resources on one chance.', 'Abandon the attempt and accept that the plan failed. Spend resources on other defenses.'] },
  wangmiao_nano_space_elevator: { title: 'Engineering Breakthrough: Wang Miao’s Nanofilament Space Elevator', dialogue: [{ speakerName: 'Wang Miao', content: 'Using Flying Blade nanomaterial, we can build an elevator to geosynchronous orbit and cut the cost of mass access to space by ninety percent.' }, { speakerName: 'Engineering Adviser', content: 'The base becomes an easy target for a Trisolaran Droplet. If it falls, tens of thousands of tons of structure crash to Earth.' }], choices: ['Begin construction and accelerate space industrialization. High risk, high potential.', 'Reject it and reserve the material for warship armor. Conservative but safer.'] },
  wangmiao_cosmic_flicker_ptsd: { title: 'Psychic Aftershock: Wang Miao Sees the Countdown Again', dialogue: [{ speakerName: 'Wang Miao', content: 'Governor, I saw it again: the countdown on my retina. This time it reads seventy-two hours. I do not know whether it is sophon intimidation or an ultimatum for all humanity.' }, { speakerName: 'Psychological Specialist', content: 'It may be trauma returning. But what if it is real? We need to prepare for both.' }], choices: ['Trust Wang Miao and enter maximum alert for seventy-two hours. It may be a false alarm, but we cannot ignore it.', 'Focus on psychological care and avoid mass mobilization. Do not cause needless panic.'] },
  aa_orbital_company_crisis: { title: 'Economic Crisis: AA’s Orbital-City Group Nears Bankruptcy', dialogue: [{ speakerName: 'AA', content: 'Governor, Asia First Orbital City Group has run out of cash. Without emergency capital, the ecological cycles of two space cities halt and millions face oxygen shortage.' }, { speakerName: 'Finance Ministry', content: 'It is a bottomless pit. Rescue it and military industry and food programs must be cut.' }], choices: ['Provide a bailout and preserve orbital-city livelihoods. Spend an immense treasury reserve.', 'Let it enter liquidation and let the market consolidate. Social unrest follows, but the treasury is spared.'] },
  guan_yifan_4d_encounter: { title: 'Encounter: Guan Yifan Falls into a Four-Dimensional Fragment', dialogue: [{ speakerName: 'Guan Yifan', content: 'While surveying ruins left by Blue Space, I fell into a stable four-dimensional bubble. From inside, I can see every detail of the three-dimensional universe, including the heart of the Trisolaran fleet.' }, { speakerName: 'Science Adviser', content: 'The fragment is unstable and can collapse at any time. To use this gift of sight, we must act now. Guan Yifan may never return.' }], choices: ['Leave Guan Yifan inside to transmit intelligence in real time. Sacrifice one person for strategic advantage.', 'Order an immediate withdrawal and seal the area. Safety first; protect the talent.'] },
  lin_yun_ball_lightning_weapon: { title: 'Lin Yun: Proposal to Weaponize Ball Lightning', dialogue: [{ speakerName: 'Lin Yun', content: 'I have mastered the trigger laws of macro-atoms and ball lightning. It can strike in a quantum state through any conventional armor. One test base gives us an ultimate weapon against Trisolaran probes.' }, { speakerName: 'Security Review', content: 'Colonel Lin Yun has a history of misusing concept weapons, and her devotion to technology crosses ethical lines. Fund her and we may create a miracle—or a disaster.' }], choices: ['Fully support Lin Yun’s weapons work. It may unlock dimensional weapons ahead of schedule.', 'Reject it as too dangerous and upgrade conventional nuclear weapons instead.'] },
  lin_yun_quantum_suicide: { title: 'Lin Yun’s Obsession: The Cost of a Quantum Attack', dialogue: [{ speakerName: 'Lin Yun', content: 'To guide a ball-lightning swarm onto target, we need an observer in an entangled quantum state. I will be that observer. Goodbye, Governor.' }, { speakerName: 'Aide', content: 'She will become a permanent quantum ghost, unable to return to reality. She chooses this for one devastating strike against the Trisolaran main force.' }], choices: ['Approve Lin Yun’s sacrifice and launch an epic quantum strike.', 'Stop her by force and find another observer. The attack window may close.'] },
  hines_belief_breakdown: { title: 'Wallfacer Hines: The Mental Seal Implodes', dialogue: [{ speakerName: 'Bill Hines', content: 'I was wrong. When soldiers sealed with certainty of victory meet true despair, their minds collapse at once in a catastrophic psychological avalanche. The seal is tearing our army apart.' }, { speakerName: 'Emergency Ministry', content: 'Reverse-hypnotize every sealed soldier immediately, or whole front lines will suffer a collective breakdown.' }], choices: ['Launch an emergency removal program, permanently damaging these soldiers’ brains. (Heavy military loss.)', 'Keep watching and hope they adapt. Gamble that the seal’s second stage stabilizes.'] },
  reydiaz_venezuela_uprising: { title: 'Desperation: Rey Diaz Faces Trial at Home', dialogue: [{ speakerName: 'Manuel Rey Diaz', content: 'After my Mercury bomb plan was rejected, a coup erupted in Venezuela. They call me a warmonger and demand extradition to an international court. I need asylum.' }, { speakerName: 'International Relations Adviser', content: 'Sheltering him damages ties with the South American Union. Abandoning him means bowing to short-sighted politicians.' }], choices: ['Grant asylum and quietly fund his research. Preserve strategic deterrence.', 'Refuse asylum and cut ties. Protect diplomatic stability.'] },
  tyler_quantum_ghost_fleet: { title: 'Ghost Fleet: Tyler’s Legacy', dialogue: [{ speakerName: 'Fleet Observer', content: 'We found an invisible fleet made entirely of macro-atoms in deep space. It holds tactical formation and appears to await orders. The database confirms Tyler built it in secret.' }, { speakerName: 'Tyler (classified historical recording)', content: 'If you see this, I no longer exist. This ghost fleet is my last gift to humanity. Activate it; like a mirage, it deceives the Trisolarans and creates an opening for the real fleet.' }], choices: ['Activate the ghost fleet and use it for strategic deception with the main force.', 'Destroy it. Tyler may have left a deeper trap.'] },
  chengxin_staircase_probe: { title: 'A Late Reunion: The Staircase Probe Answers', dialogue: [{ speakerName: 'Deep-Space Communications', content: 'A weak signal has arrived from the Staircase probe long believed lost. It appears modified by the Trisolarans and carries a vast archive of technical material.' }, { speakerName: 'Cheng Xin', content: 'It is Yun Tianming. He did it. He is showing us the way in his own manner. Download everything.' }], choices: ['Download at full speed despite possible sophon monitoring. Acquire the core of Trisolaran technology.', 'Receive cautiously. It may be a Trisolaran Trojan horse.'] },
  shiqiang_fake_etar_plan: { title: 'Da Shi’s Play: A Fake ETO Fishing Operation', dialogue: [{ speakerName: 'Shi Qiang', content: 'We fake an ETO remnant, say it has the sophons’ secret, and broadcast the claim toward the Trisolaran fleet too. The real ETO will panic and surface by itself.' }, { speakerName: 'Intelligence Adviser', content: 'It may anger the real ETO into striking early. If it works, though, we clear out the hidden vermin in one sweep.' }], choices: ['Approve Da Shi’s sting. It costs little and may pay off enormously.', 'Too risky. Reject it and use a safer method.'] },
  beihai_last_stand: { title: 'Zhang Beihai’s End: A Fatal Blow for Earth', dialogue: [{ speakerName: 'Natural Selection', content: 'A Trisolaran probe is accelerating toward Earth. We have maneuvered onto a collision course. Tell everyone on Earth Zhang Beihai never betrayed them. This is the final reinforcement.' }, { speakerName: 'Fleet Command', content: 'He plans to ram the Droplet with Natural Selection. Even success buys only hours, at the cost of the starship and every life aboard.' }], choices: ['Authorize the collision. Trade a hero’s sacrifice for precious time.', 'Order withdrawal and preserve the force. Earth faces the strike alone.'] },
  yewenjie_redemption: { title: 'Redemption: Ye Wenjie’s Confession', dialogue: [{ speakerName: 'Ye Wenjie', content: 'My life was an error. I lit the fire and could not control it. I will give you every result of my work breaking Trisolaran communication protocols. It is the only compensation I can offer.' }, { speakerName: 'Chang Weisi', content: 'Take her data, but never trust her repentance. She is still the person who pressed the button.' }], choices: ['Accept Ye Wenjie’s technical help and use it to strengthen communications security.', 'Refuse and imprison her alone for life. Let pure punishment comfort history.'] },
  guan_yifan_dimensional_fold: { title: 'Last Resort: Guan Yifan Trapped at the Edge of Two-Dimensionalization', dialogue: [{ speakerName: 'Guan Yifan', content: 'I am observing a naturally formed two-dimensional region at the Solar System’s edge. Its expansion has accelerated; I cannot escape. I will try to seal myself inside an experimental curvature bubble.' }, { speakerName: 'Cheng Xin', content: 'No. We cannot lose another brilliant scientist. Send a ship now.' }], choices: ['Dispatch a rescue craft and risk turning the vessel two-dimensional as well.', 'Honor Guan Yifan’s sacrifice and record his final research remotely.'] },
  aa_pleasure_city_scandal: { title: 'Crisis: AA’s Star-Ring Group Faces a Trust Scandal', dialogue: [{ speakerName: 'PDC Joint Oversight Office', content: 'An inquiry finds AA’s Star Ring orbital-city group may have diverted vast Earth-defense funds. She says every credit went to an undisclosed lightspeed-ship program.' }, { speakerName: 'AA', content: 'Governor, Star Ring is being framed. An orbital city needs flexible finance to survive this environment. I diverted nothing; this work is for the lightspeed engine and humanity’s only way out.' }], choices: ['Investigate Star Ring fully, seize improper funds, and strengthen public oversight. (Economic loss; government prestige rises.)', 'Grant leniency and support its technical pilot program. (Economic growth; small government-prestige loss.)'] },
  liucixin_devourer_approaching: { title: 'Alarm: The Devourer Approaches', dialogue: [{ speakerName: 'PDC Deep-Space Station', content: 'Alert. A ring-shaped ship fifty thousand kilometers long—the Devourer—is slowing toward the Solar System. Its envoy claims descent from Earth’s dinosaurs and says it will consume the planets as fuel.' }, { speakerName: 'Ding Yi', content: 'Governor, the Devourer outclasses us technologically. Its philosophy is simple: it is a herd of nomadic beasts in space. Decide immediately.' }], choices: ['Accelerate heavy-fusion research and prepare planetary-engine technology. Spend resources to build industrial reserves.', 'Open diplomacy with the Devourer Empire and offer lunar mining rights for peace. Gain short-term resources at a severe cultural cost.'] },
  liucixin_poetry_cloud_art: { title: 'Wonder: Li Bai’s Stellar Poetry-Cloud Project', dialogue: [{ speakerName: 'Astronomer', content: 'Unbelievable. A quantum godlike civilization calling itself Li Bai has arrived. It intends to write every possible classical Chinese poem and turn Solar System matter—including Earth—into quantum storage.' }, { speakerName: 'Humanities Scholar', content: 'Governor, this is Great Art in its final form. To such beings, survival and destruction matter less than a perfect poem. We must speak through culture.' }], choices: ['Send humanity’s finest literary delegates to answer in verse. Show our artistic soul and gain culture and prestige.', 'Try to steal the Poetry Cloud’s polarized gravitational-wave spectrum for fundamental-physics data. Extremely risky, but may advance science.'] },
  liucixin_altar_of_truth: { title: 'The Final Question: The Altar of Truth', dialogue: [{ speakerName: 'Eliminator', content: 'I am an interstellar eliminator. Your pursuit of physics is nearing vacuum decay. I can answer your final question about unification, but anyone who learns it turns to dust in the next second.' }, { speakerName: 'Ding Yi', content: 'To hear the Way in the morning and die by evening is enough. Governor, let us scientists ascend the altar. Before ultimate truth, life is only dust.' }], choices: ['Let Ding Yi and the leading physicists ascend. Trade precious lives for a leap in universal constants. (Military research rises; population and prestige suffer.)', 'Refuse this cruel bargain. Seek truth by human hands through time. (Social cohesion and culture rise.)'] },
  liucixin_cryogenic_art: { title: 'Cosmic Aesthetics: Ocean-Ice Ring Installation', dialogue: [{ speakerName: 'Cryogenic Artist', content: 'Earth’s water is ideal for microscopic crystal sculpture. I drew up your Pacific and Atlantic, froze them into an orbital ring, and gave you a cosmic ice exhibition. Enjoy Great Art.' }, { speakerName: 'AA', content: 'The oceans are frozen in the sky and their refraction makes rainbow light. It devastates the ecology, but it is the most magnificent sight in the universe. What do we do?' }], choices: ['Mobilize citizens to join the refraction with ground lasers and city lights. Celebrate the cosmic artwork. (Large culture and cohesion gain; economic cost.)', 'Deploy high-power microwave arrays to melt the ring and recover the water. Save ecology and population, but anger the artist and lose reputation.'] },
  galaxy_zeroer_broadcast: { title: 'Ultimate Transmission: The Returners’ Broadcast', dialogue: [{ speakerName: 'Deep-Space Communications Officer', content: 'Commander, we detected an overwhelming patterned fluctuation across every band of the cosmic microwave background…' }, { speakerName: 'Returners (broadcast)', content: 'We call upon every civilization: return the mass of your mini-universes and restart the timeline. The great universe is dying.' }], choices: ['Remain silent and refuse to answer.', 'Send a symbolic reply coordinate.'] },
  galaxy_2d_wave_approaching: { title: 'Warning: The Two-Dimensional Wavefront Approaches', dialogue: [{ speakerName: 'Gravitational-Wave Antenna AI', content: 'Warning. A dimensional-collapse wavefront has been detected in the starfield behind us. The two-dimensionalized remains of the Solar System are spreading toward our route.' }, { speakerName: 'Chief Scientist', content: 'We must accelerate. If it catches us, we become a painting.' }], choices: ['Overload the engines and flee.', 'Hold speed and trust fate.'] },
  galaxy_proxima_habitability: { title: 'Colony Report: Tidal Lock on Proxima b', dialogue: [{ speakerName: 'Colony Governor', content: 'Proxima b is tidally locked: the day side is lava hell, the night side absolute cold. Cities can exist only in the narrow twilight band.' }, { speakerName: 'Sociologist', content: 'Space is desperately crowded, and residents are losing control.' }], choices: ['Impose strict population quotas and space controls.', 'Invest in underground-city expansion.'] },
  galaxy_curvature_engine_fuel: { title: 'Crisis: Curvature-Drive Fuel Exhausted', dialogue: [{ speakerName: 'Fleet Chief Engineer', content: 'Long lightspeed travel has exhausted our antimatter reserves. Without a supply point, we drift forever through the interstellar desert.' }], choices: ['Capture a rogue planet along the route and mine it.', 'Force part of the crew into deep hibernation to save energy.'] },
  galaxy_micro_universe_door: { title: 'Miracle: A Mini-Universe Gate Signal', dialogue: [{ speakerName: 'Deep-Space Scout', content: 'Report: an anomalous gravity point lies in the void ahead. It perfectly matches the theoretical signature of a mini-universe entrance.' }, { speakerName: 'Historian', content: 'Could this be Mini-Universe 647, Yun Tianming’s gift to Cheng Xin?' }], choices: ['Launch a probe and attempt to dock.', 'The danger is too great. Record the coordinates and leave.'] },
  galaxy_time_dilation_reunion: { title: 'Years in the Black Domain: Fleet Reunion', dialogue: [{ speakerName: 'Communications Officer', content: 'We have met another escape formation. Wait—their timestamps are three centuries later than ours. They experienced extreme Black Domain time dilation.' }, { speakerName: 'Sociologist', content: 'The cultural break is severe. They do not even recognize our starship government.' }], choices: ['Absorb them by force and garrison their ships.', 'Let them form an autonomous district.'] },
  galaxy_dark_matter_life: { title: 'Discovery: Macro-Electrons in a Dark-Matter Sea', dialogue: [{ speakerName: 'Physicist', content: 'In this nebula, we observe active dark-matter condensates behaving like life. They strongly resemble the macro-electrons recorded in Lin Yun’s discovery.' }], choices: ['Try to capture and study them.', 'Keep clear and avoid disturbing them.'] },
  galaxy_heat_death_omen: { title: 'Ultimate Fear: An Omen of Heat Death', dialogue: [{ speakerName: 'Observatory Director', content: 'New observations show mass in the universe’s large-scale structure is disappearing faster. Perhaps the Big Crunch never comes; perhaps the universe ends in silent heat death.' }, { speakerName: 'Public Representative', content: 'The news has plunged the whole starship into an existential crisis.' }], choices: ['Conceal the data.', 'Tell the truth and urge people to live while they can.'] },
  bunker_jupiter_city_construction: { title: 'Strategic Intelligence: Jupiter Bunker Cities Take Shape', dialogue: [{ speakerName: 'PDC Joint Oversight Office', content: 'Governor, the bunker-city cluster behind Jupiter—New Beijing and New Shanghai—is more than halfway built. Hidden in the giant planet’s vast shadow, it offers humanity a final refuge from solar destruction.' }, { speakerName: 'AA', content: 'Star Ring has delivered Sector Three. These vast domes, supported by ultralight carbon nanotubes, can be fully self-sufficient. Governor, the space cities are humanity’s future ark.' }], choices: ['Push construction at full speed and shift more resources to it. (Large economic and prestige gain; consumes basic resources.)', 'Keep the normal schedule and preserve resources for Earth’s defense. (Steady transition; no extra cost.)'] },
  bunker_light_speed_research: { title: 'Top-Secret Project: Star Ring Lightspeed-Engine Trials', dialogue: [{ speakerName: 'Thomas Wade', content: 'Advance. Advance by any means. Preliminary lightspeed-ship work has broken through. We need more research capacity for a flight trial. This is the only real chance to leave the Solar System and escape.' }, { speakerName: 'Cheng Xin', content: 'Wade, this will cause worldwide panic and a surge of escapism. The UN will call it illegal. Are we abandoning most of humanity?' }], choices: ['Defy PDC pressure and secretly send technical funds to Wade’s Star Ring. (Great research and culture gain; sharply raises unrest and rebellion.)', 'Enforce the United Government ban and close Star Ring’s secret test zone. (Lowers rebellion; loses a key escape chance.)'] },
  bunker_2d_foil_warning: { title: 'Defense Drill: The Dual-Vector Foil Shelter Plan', dialogue: [{ speakerName: 'PDC Joint Defense Commander', content: 'Governor, the orbital cities are drilling for dimensional attack by dual-vector foil. During high-speed relocation, their gravity-adaptation systems show a small resonance mismatch.' }, { speakerName: 'New Beijing Resident', content: 'When dimensional attack comes, our three-dimensional cities are bubbles on water. Is it worth spending so much on survival plans with almost no chance?' }], choices: ['Use reserve funds to upgrade emergency orbital-transfer thrusters. (Costs resources; greatly raises morale and reduces rebellion.)', 'Maintain the status quo and tell residents that drills are the foundation of defense. (Stable; no effect.)'] },
  bunker_earth_remnant_preservation: { title: 'Cultural Heritage: The Earth Museum Plan', dialogue: [{ speakerName: 'AA', content: 'Most people have moved to cities behind Jupiter and Saturn. Earth is nearly abandoned. Star Ring proposes preserving several surface monuments as humanity’s permanent spiritual anchor.' }, { speakerName: 'Historian', content: 'However far we travel, Mother Earth is the root of our culture. Fund vast climate-field domes around the Louvre, the Forbidden City, and the pyramids.' }], choices: ['Fund the Mother Earth Museum generously. (Large culture and cohesion gain; major economic cost.)', 'Reject it: in a crisis era, every coin belongs to survival and defense. (Slower culture growth; small preparedness gain.)'] },
  bunker_dome_leakage_crisis: { title: 'Emergency: Microfracture in New Beijing’s Dome', dialogue: [{ speakerName: 'Orbital City Mayor', content: 'Governor, a meteor shower caused a micron-scale stress crack in the south Sector Four dome of New Beijing. Gas loss is accelerating and residents are panicking.' }, { speakerName: 'Dome Maintenance Chief Engineer', content: 'We need industrial robots to inject rapid-curing nanogel into the fracture immediately. Containment requires major industrial reserves.' }], choices: ['Release reserves, seal the breach, and evacuate the southern district. (Costs industrial resources; saves everyone and restores morale.)', 'Make the orbital city fund its own repair. (Delay may cause casualties and deepen panic.)'] },
  bunker_dark_forest_telemetry: { title: 'Strategic Debate: Can a Low-Lightspeed Black Domain Be a Safety Declaration?', dialogue: [{ speakerName: 'Thomas Wade', content: 'A low-lightspeed Black Domain locks us forever in a dead room that no one can enter or leave. It is a coward’s slow death. Humanity could fly to the stars with lightspeed engines.' }, { speakerName: 'Cheng Xin', content: 'But a Black Domain is the universe’s only safety declaration: proof that humanity is harmless. Only then do the hunters lower their guns and the Solar System avoid dual-vector foil.' }], choices: ['Favor Black Domain research and the safety-declaration theory. (Great defense and social harmony; permanently loses long-range exploration.)', 'Favor Wade’s lightspeed-voyage faction and continue high-technology exploration. (Large research prestige gain; deterrence becomes less stable.)'] },
};

export const localizeNarrative = (
  event: GameEventPayload,
  language: 'zh' | 'en',
): GameEventPayload => {
  const translation = language === 'en' ? englishNarratives[event.id] : undefined;
  if (!translation) return event;

  return {
    ...event,
    title: translation.title,
    dialogQueue: event.dialogQueue.map((node, index) => ({
      ...node,
      ...translation.dialogue[index],
    })),
    choices: event.choices?.map((choice, index) => ({
      ...choice,
      label: translation.choices?.[index] ?? choice.label,
    })),
  };
};
