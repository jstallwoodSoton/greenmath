let animal_json;
let animal_pictures;
let training_data, subsets, probabilities;
let training_data_counter = 0;
let prob_tbl_counter = 0;
let player_score = 0;
let nadia_score = 0;


async function get_animal_data(URL, IMG_URL) {
    let raw = await fetch(URL);
    animal_json = await raw.json();

    let raw_images = await fetch(IMG_URL);
    animal_pictures = await raw_images.json();

    initialize_training_data();
    initialize_subsets();
    calculate_all_probabilities();

    update_training_data_display();
    update_prob_table_display();

    let first_question = get_question();
    update_question_display(first_question);
}

get_animal_data("./json/animaldata.json", "./json/animalpictures.json");

function get_random_animal() {
    let animals = Object.keys(animal_json);
    let index = Math.floor(Math.random() * (animals.length - 1));
    return animals[index];
}

function initialize_training_data(amount = 10) {
    training_data = [];
    do {
        let a = get_random_animal();
        if(!training_data.includes(a)) {
            training_data.push(a);
        }
    }while(training_data.length < amount);
}

function add_animal_to_subset(category, subset, animal_name) {
    if(!Object.keys(subsets).includes(category)) {
        subsets[category] = {};
    }

    
    if(!Object.keys(subsets[category]).includes(subset)) {
        subsets[category][subset] = new Set();
    }

    subsets[category][subset].add(animal_name);
}

function initialize_subsets() {
    subsets = {};
    training_data.forEach(animal => {
        Object.keys(animal_json[animal]).forEach(category => {
            add_animal_to_subset(category, animal_json[animal][category], animal);
        })
    })
}

function calculate_conditional_probability(category_one, subset_one, category_two, subset_two) {
    let A = subsets[category_one][subset_one];
    let B = subsets[category_two][subset_two];
    if(B.size == 0) { return 0; }
    if(category_one == category_two) { return 0; }
    let inters = A.intersection(B);
    return inters.size / B.size;
}

function calculate_all_probabilities() {
    probabilities = {};
    Object.keys(subsets).forEach(category => {
        Object.keys(subsets[category]).forEach(subset => {
            probabilities[subset] = {};
        })
    })

    Object.keys(subsets).forEach(category => {
        Object.keys(subsets[category]).forEach(sub => {
            Object.keys(subsets).forEach(kategory => {
                if(category != kategory) {
                    Object.keys(subsets[kategory]).forEach(zub => {
                        let lbl = "p(" + sub + " | " + zub + ")";
                        let prob = calculate_conditional_probability(category, sub, kategory, zub);
                        probabilities[sub][lbl] = prob;
                    })
                }
            })
        })
    })
}

function get_question() {
    let animal = null;
    do {
        let possible = get_random_animal();
        if(!training_data.includes(possible)) {
            animal = possible;
        }
    }while(animal == null)

    let categories = Object.keys(animal_json[animal]);
    let i = Math.floor(Math.random() * (categories.length - 1));
    let given = categories[i];
    categories.splice(i, 1);
    let j = Math.floor(Math.random() * (categories.length - 1));
    let secondary = categories[j];

    let given_subset = animal_json[animal][given];
    let answer = animal_json[animal][secondary];

    let options = Object.keys(subsets[secondary]);
    let k = Math.floor(Math.random() *(options.length - 1));
    let random_subset = options[k];

    let question = "The next animal is a(n) " + given_subset.toLowerCase() + " type. Given that, do you think they are a(n) " + random_subset.toLowerCase() + " type?";

    let bg = bot_guess(given_subset, random_subset, secondary);
    let true_score = (random_subset == answer)? 1:0;

    return [question, answer, bg, animal, true_score];
}

function bot_guess(given_subset, random_subset, secondary) {
    let sum = 0;
    let type = random_subset;
    Object.keys(subsets[secondary]).forEach(option => {
        let key = "p(" + option + " | " + given_subset + ")";
        if(key in probabilities[option]) {
            if(sum < probabilities[option][key]) {
                sum = probabilities[option][key];
                type = option;
            }
        }
    })

    if(type == random_subset) {
        return "I think that's correct!"
    }
    else{
        return "I don't think " + random_subset.toLowerCase() + " is correct. I think it is most probably a(n) " + type.toLowerCase() + " type";
    }

}

function add_new_animal_to_mix(animal) {
    training_data.push(animal);
    initialize_subsets();
    calculate_all_probabilities();
}

function update_training_data_display() {
    let animal_name = training_data[training_data_counter];
    let animal_diet = animal_json[animal_name]["Diet"];
    let animal_domain = animal_json[animal_name]["Domain"];
    let animal_status = animal_json[animal_name]["Status"];
    let animal_portrait = animal_pictures[animal_name];

    document.getElementById("td-animal-name").innerHTML = animal_name;
    document.getElementById("td-animal-diet").innerHTML = animal_diet;
    document.getElementById("td-animal-domain").innerHTML = animal_domain;
    document.getElementById("td-animal-status").innerHTML = animal_status;
    document.getElementById("td-animal-img").src = "./img/animal_portraits/" + animal_portrait;
}

function change_td_counter(amount) {
    training_data_counter += amount;
    if(training_data_counter > training_data.length - 1) { training_data_counter = 0; }
    if(training_data_counter < 0) { training_data_counter = training_data.length - 1; }
    update_training_data_display();
}

function change_prob_tbl_counter(amount) {
    prob_tbl_counter += amount;
    let l = Object.keys(probabilities).length;
    if(prob_tbl_counter > l - 1) { prob_tbl_counter = 0; }
    if(prob_tbl_counter < 0) { prob_tbl_counter = l - 1; }

    update_prob_table_display();
}

function update_prob_table_display() {
    let category = Object.keys(probabilities)[prob_tbl_counter];
    let sub = Object.keys(probabilities[category]);

    let tbl = document.getElementById("prob-data-tbl");
    tbl.innerHTML = "";
    sub.forEach(s => {
        let tr = document.createElement("tr");
        let th = document.createElement("th");
        let td = document.createElement("td");
        
        th.innerHTML = s;
        td.innerHTML = probabilities[category][s].toFixed(4);

        tr.appendChild(th);
        tr.appendChild(td);
        tbl.appendChild(tr);
    })

    document.getElementById("prob-tbl-name").innerHTML = category;
}

function update_question_display(question_data) {
    document.getElementById("question_txt").innerHTML = question_data[0];
    document.getElementById("nadia_txt").innerHTML = question_data[2];

    let true_btn = document.getElementById("true");
    let false_btn = document.getElementById("false");

    true_btn.setAttribute("onclick", null);
    false_btn.setAttribute("onclick", null);

    true_btn.onclick = function() {
        document.getElementById("question_txt").innerHTML = "";
        document.getElementById("nadia_txt").innerHTML = "";
        true_btn.disabled = true;
        false_btn.disabled = true;
        if(question_data[4] == 1) {
            player_score += 1;
        }
        else {
            nadia_score += 1;
        }
        document.getElementById("player_score_lbl").innerHTML = player_score.toString();
        document.getElementById("bot_score_lbl").innerHTML = nadia_score.toString();
        document.getElementById("answer_txt").innerHTML = get_answer_text(question_data[3], question_data[1]);

        setTimeout(() => {
            true_btn.disabled = false;
            false_btn.disabled = false;
            if(!check_game_over()) {
                let question = get_question();
                update_question_display(question);
                document.getElementById("answer_txt").innerHTML = "";
            }
            else {
                true_btn.style.display = "none";
                document.getElementById("answer_txt").innerHTML = get_winner_text();
            }
            
        }, 5000);
        add_new_animal_to_mix(question_data[3]);
        training_data_counter = training_data.length - 1;
        update_training_data_display();
        update_prob_table_display();
    }

    false_btn.onclick = function() {
        document.getElementById("question_txt").innerHTML = "";
        document.getElementById("nadia_txt").innerHTML = "";
        true_btn.disabled = true;
        false_btn.disabled = true;
        if(question_data[4] == 1) {
            nadia_score += 1;
        }
        else {
            player_score += 1;
        }
        document.getElementById("player_score_lbl").innerHTML = player_score.toString();
        document.getElementById("bot_score_lbl").innerHTML = nadia_score.toString();
        document.getElementById("answer_txt").innerHTML = get_answer_text(question_data[3], question_data[1]);

        setTimeout(() => {
            true_btn.disabled = false;
            false_btn.disabled = false;
            if(!check_game_over()) {
                let question = get_question();
                update_question_display(question);
                document.getElementById("answer_txt").innerHTML = "";
            }
            else {
                false_btn.style.display = "none";
                document.getElementById("answer_txt").innerHTML = get_winner_text();
            }
            
        }, 5000);
        add_new_animal_to_mix(question_data[3]);
        training_data_counter = training_data.length - 1;
        update_training_data_display();
        update_prob_table_display();
    }
}

function check_game_over() {
    return player_score == 5 || nadia_score == 5;
}

function get_winner_text() {
    if(player_score > nadia_score) {
        return "Well done! You've won."
    }
    else {
        return "Never mind. Try again."
    }
}

function get_answer_text(animal, answer) {
    return "The " + animal.toLowerCase() + " is a(n) " + answer.toLowerCase() + " type."
}

document.change_td_counter = change_td_counter
document.change_prob_tbl_counter = change_prob_tbl_counter;

