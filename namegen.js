// === BookSpritz: Character Name Generator ===
// Built-in database of common names across origins. All public-domain common names.

const NAME_DATABASE = {
    english: {
        male: ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Thomas', 'Charles', 'Daniel', 'Matthew', 'Christopher', 'Andrew', 'Joseph', 'Steven', 'Edward', 'Henry', 'George', 'Albert', 'Arthur', 'Walter'],
        female: ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen', 'Nancy', 'Lisa', 'Margaret', 'Sandra', 'Ashley', 'Emily', 'Donna', 'Michelle', 'Carol', 'Amanda']
    },
    french: {
        male: ['Jean', 'Pierre', 'Jacques', 'Michel', 'André', 'Philippe', 'Louis', 'François', 'Henri', 'Claude', 'Antoine', 'Marc', 'Paul', 'Nicolas', 'Stéphane', 'Olivier', 'Sébastien', 'Guillaume'],
        female: ['Marie', 'Sophie', 'Isabelle', 'Catherine', 'Anne', 'Nathalie', 'Brigitte', 'Françoise', 'Christine', 'Marguerite', 'Juliette', 'Camille', 'Madeleine', 'Adèle', 'Céleste', 'Élodie', 'Vivienne']
    },
    german: {
        male: ['Hans', 'Klaus', 'Wolfgang', 'Jürgen', 'Heinrich', 'Friedrich', 'Wilhelm', 'Otto', 'Karl', 'Günter', 'Dieter', 'Stefan', 'Andreas', 'Matthias', 'Lukas', 'Sebastian', 'Felix', 'Jonas'],
        female: ['Helga', 'Ursula', 'Ingrid', 'Helga', 'Gisela', 'Brunhilde', 'Sieglinde', 'Annegret', 'Karin', 'Renate', 'Heidi', 'Sabine', 'Birgit', 'Monika', 'Petra', 'Frauke', 'Anneliese']
    },
    italian: {
        male: ['Giovanni', 'Marco', 'Giuseppe', 'Antonio', 'Francesco', 'Alessandro', 'Luca', 'Andrea', 'Matteo', 'Lorenzo', 'Roberto', 'Sergio', 'Stefano', 'Daniele', 'Vincenzo', 'Salvatore', 'Domenico'],
        female: ['Giulia', 'Sofia', 'Aurora', 'Beatrice', 'Alice', 'Alessia', 'Martina', 'Chiara', 'Elena', 'Francesca', 'Valentina', 'Giuseppina', 'Rosa', 'Angela', 'Lucia', 'Maria', 'Gabriella']
    },
    spanish: {
        male: ['Juan', 'José', 'Antonio', 'Manuel', 'Francisco', 'David', 'Juan', 'Javier', 'Daniel', 'Carlos', 'Jesús', 'Alejandro', 'Miguel', 'Pedro', 'Pablo', 'Rafael', 'Fernando', 'Diego', 'Álvaro'],
        female: ['María', 'Carmen', 'Ana', 'Isabel', 'Dolores', 'Pilar', 'Rosa', 'Teresa', 'Cristina', 'Lucía', 'Elena', 'Patricia', 'Sara', 'Laura', 'Marta', 'Andrea', 'Paula', 'Daniela']
    },
    nordic: {
        male: ['Lars', 'Magnus', 'Erik', 'Nils', 'Anders', 'Johan', 'Kristian', 'Olav', 'Bjørn', 'Henrik', 'Søren', 'Mikkel', 'Frederik', 'Oskar', 'Anton', 'Emil', 'Viggo', 'Thor', 'Odin'],
        female: ['Astrid', 'Ingrid', 'Greta', 'Freya', 'Sigrid', 'Astrid', 'Hilda', 'Liv', 'Saga', 'Linnea', 'Astrid', 'Idun', 'Solveig', 'Tuva', 'Eira', 'Runa', 'Signe', 'Ylva']
    },
    slavic: {
        male: ['Ivan', 'Dmitri', 'Sergei', 'Andrei', 'Nikolai', 'Vladimir', 'Mikhail', 'Pavel', 'Boris', 'Yuri', 'Alexei', 'Petr', 'Maksim', 'Denis', 'Anton', 'Kirill', 'Egor', 'Artem'],
        female: ['Natasha', 'Olga', 'Tatiana', 'Irina', 'Svetlana', 'Elena', 'Marina', 'Galina', 'Vera', 'Nadezhda', 'Ludmila', 'Valentina', 'Ekaterina', 'Anastasia', 'Polina', 'Daria', 'Ksenia']
    },
    arabic: {
        male: ['Ahmed', 'Mohammed', 'Ali', 'Omar', 'Hassan', 'Hussein', 'Ibrahim', 'Yusuf', 'Khalid', 'Tariq', 'Abdullah', 'Karim', 'Rashid', 'Sami', 'Nabil', 'Farid', 'Jamal', 'Said'],
        female: ['Fatima', 'Aisha', 'Zainab', 'Maryam', 'Khadija', 'Hala', 'Layla', 'Noor', 'Salma', 'Yasmin', 'Amira', 'Rania', 'Sahar', 'Nadia', 'Hana', 'Lina', 'Rima']
    },
    japanese: {
        male: ['Hiroshi', 'Takeshi', 'Akira', 'Daisuke', 'Kenji', 'Yuki', 'Haruto', 'Souta', 'Riku', 'Ren', 'Kaito', 'Sora', 'Itsuki', 'Minato', 'Yuma', 'Asahi', 'Tsubasa', 'Kai'],
        female: ['Yuki', 'Sakura', 'Aoi', 'Hina', 'Yui', 'Mio', 'Rin', 'Hana', 'Mei', 'Nanami', 'Kotone', 'Yua', 'Tsubaki', 'Asuka', 'Kaori', 'Mai', 'Riko', 'Akemi']
    },
    fantasy: {
        male: ['Aldric', 'Branor', 'Cedric', 'Darian', 'Elric', 'Faelan', 'Garrick', 'Hadrian', 'Isolde', 'Jorah', 'Kael', 'Lothar', 'Magnus', 'Nyx', 'Orin', 'Percival', 'Quentin', 'Roran', 'Soren', 'Theron', 'Ulric', 'Varian', 'Wren', 'Xander', 'Yorick', 'Zephyr'],
        female: ['Aeliana', 'Briar', 'Celeste', 'Daelia', 'Elara', 'Freya', 'Gwendolyn', 'Hex', 'Isolde', 'Jael', 'Kira', 'Lyra', 'Mira', 'Nyssa', 'Ophira', 'Petra', 'Quinna', 'Rowan', 'Seraphina', 'Thalia', 'Una', 'Vesper', 'Wynn', 'Xara', 'Yvaine', 'Zara']
    }
};

function generateName(origin, allowMale, allowFemale) {
    let origins = origin === 'any' ? Object.keys(NAME_DATABASE) : [origin];
    // Filter to origins that exist
    origins = origins.filter(o => NAME_DATABASE[o]);
    if (origins.length === 0) origins = Object.keys(NAME_DATABASE);

    const o = origins[Math.floor(Math.random() * origins.length)];
    const data = NAME_DATABASE[o];
    const genders = [];
    if (allowMale) genders.push('male');
    if (allowFemale) genders.push('female');
    if (genders.length === 0) genders.push('male'); // default

    const g = genders[Math.floor(Math.random() * genders.length)];
    const names = data[g];
    const name = names[Math.floor(Math.random() * names.length)];
    return { name, origin: o, gender: g };
}

function generateBatchNames(count, origin, allowMale, allowFemale) {
    const results = [];
    const seen = new Set();
    let attempts = 0;
    while (results.length < count && attempts < count * 5) {
        const r = generateName(origin, allowMale, allowFemale);
        if (!seen.has(r.name)) { seen.add(r.name); results.push(r); }
        attempts++;
    }
    return results;
}

function renderNameGenResults() {
    const origin = $('nameOriginSelect').value;
    const allowMale = $('nameGenderMale').checked;
    const allowFemale = $('nameGenderFemale').checked;
    const names = generateBatchNames(8, origin, allowMale, allowFemale);
    const container = $('nameGenResults');
    if (names.length === 0) {
        container.innerHTML = '<div class="search-empty">No names generated. Try selecting at least one gender.</div>';
        return;
    }
    container.innerHTML = names.map(n => 
        `<div class="name-chip" data-name="${escapeHTML(n.name)}"><span>${escapeHTML(n.name)}</span><span class="name-origin">${n.origin}</span><span class="name-add" title="Add as keyword">+</span></div>`
    ).join('');
    // Wire up click to add as keyword
    container.querySelectorAll('.name-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const name = chip.dataset.name;
            const book = getActiveBook();
            if (book && !book.keywords[name]) {
                book.keywords[name] = { notes: 'No lore notes yet.', active: true, partialMatch: false, bold: false, italic: false, textColor: '' };
                debouncedSave();
                LoreSystem.renderKeywords();
                LoreSystem.highlightKeywords();
                chip.style.opacity = '0.4';
                chip.style.pointerEvents = 'none';
                chip.innerHTML = `<span>${escapeHTML(name)}</span><span style="color:#4CAF50;font-size:0.8rem;">added</span>`;
            } else if (book && book.keywords[name]) {
                CustomUI.alert('"' + name + '" is already a keyword.', 'Already Exists');
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    $('nameGenBtn').addEventListener('click', () => {
        $('nameGenModal').classList.remove('hidden');
        renderNameGenResults();
    });
    $('closeNameGenBtn').addEventListener('click', () => $('nameGenModal').classList.add('hidden'));
    $('genNameBtn').addEventListener('click', renderNameGenResults);
});
