let animal_json;
let training_data;
let subsets;
let probabilities;
let player_score = 0;
let nadia_score = 0;

async function get_animal_data(URL) {
    let raw = await fetch(URL);
    animal_json = await raw.json();

    initialize_training_data();
    initialize_subsets();
    calculate_all_probabilities();

    update_training_data_table();
    update_prob_tbl_selection();

}

get_animal_data("/json/animaldata.json");

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

function update_training_data_table() {
    let tbl = document.getElementById("train_data_tbl");
    tbl.innerHTML = "";
    let capt = document.createElement("caption");
    capt.innerHTML = "Training Data";
    tbl.appendChild(capt);

    let head_tr = document.createElement("tr");
    let name_th = document.createElement("th");
    name_th.innerHTML = "Name";
    head_tr.appendChild(name_th);
    Object.keys(animal_json[training_data[0]]).forEach(heading => {
        let th = document.createElement("th");
        th.innerHTML = heading;
        head_tr.appendChild(th);
    })
    tbl.appendChild(head_tr);

    training_data.forEach(animal => {
        let tr = document.createElement("tr");
        let name = document.createElement("td");
        name.innerHTML = animal;
        tr.appendChild(name);
        Object.keys(animal_json[animal]).forEach(heading => {
            let td = document.createElement("td");
            td.innerHTML = animal_json[animal][heading];
            tr.appendChild(td);
        })
        tbl.appendChild(tr);
    })
}

function create_probability_table(subset_lbl) {
    let tbl = document.createElement("table");
    let capt = document.createElement("caption");
    capt.innerHTML = subset_lbl;
    tbl.appendChild(capt);

    
    Object.keys(probabilities[subset_lbl]).forEach(prob_lbl => {
        let tr = document.createElement("tr");
        let th = document.createElement("th");
        th.innerHTML = prob_lbl;
        let td = document.createElement("td");
        td.innerHTML = probabilities[subset_lbl][prob_lbl].toFixed(4);
        tr.appendChild(th);
        tr.appendChild(td);
        tbl.appendChild(tr);
    })
    
    return tbl;
}

function update_prob_tbl_selection() {
    let selection = document.getElementById("prob_tbl_select");
    selection.innerHTML = "";

    let blank = document.createElement("option");
    blank.innerHTML = "--select a probability category--";
    blank.value = 0;
    blank.selected = true;
    blank.hidden = true;
    blank.disabled = true;
    selection.appendChild(blank);

    Object.keys(probabilities).forEach(group => {
        let opt = document.createElement("option");
        opt.innerHTML = group;
        opt.value = group;
        selection.appendChild(opt);
    })
}

function display_probability_table() {
    let div = document.getElementById("prob_tbl_div");
    div.innerHTML = "";
    let selection = document.getElementById("prob_tbl_select");
    if(selection.value != "") {
        div.appendChild(create_probability_table(selection.value));
    }
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
        return "NadiaBot: I think that's correct!"
    }
    else{
        return "NadiaBot: I don't think " + random_subset.toLowerCase() + " is correct. I think it is most probably a(n) " + type.toLowerCase() + " type";
    }

}

function setup_question() {
    document.getElementById("ask_btn").style.display = "none";

    if(nadia_score != 5 && player_score != 5) {
        load_question();
    }
    else {
        check_winner();
    }
}

function check_winner() {
    if(nadia_score == 5 || player_score == 5) {
        let question_panel = document.getElementById("question_panel");
        question_panel.style.display = "flex";

        let true_btn = document.getElementById("true_btn");
        true_btn.style.display = "none";
        let false_btn = document.getElementById("false_btn");
        false_btn.style.display = "none";

        let question_lbl = document.getElementById("question_text");

        if(nadia_score > player_score) {
            question_lbl.innerHTML = "Game Over! NadiaBot wins."
        }
        else {
            question_lbl.innerHTML = "Game Over! Well done, you won."
        }
    }
    else {
        document.getElementById("ask_btn").style.display = "block";
    }
}

function load_question() {
    let question_data = get_question();

    let question_panel = document.getElementById("question_panel");
    question_panel.style.display = "flex";

    let question_lbl = document.getElementById("question_text");
    question_lbl.innerHTML = question_data[0] + "<br><br>" + question_data[2];

    let button_div = document.getElementById("button_div");
    button_div.style.display = "flex";

    let true_btn = document.getElementById("true_btn");
    true_btn.setAttribute("onclick", null);
    let false_btn = document.getElementById("false_btn");
    false_btn.setAttribute("onclick", null);

    let answer_string = "The " + question_data[3].toLowerCase() + " is a(n) " + question_data[1].toLowerCase() + " type."

    if(question_data[4] == 1) {
        true_btn.onclick = function() {
            player_score += 1;
            button_div.style.display = "none";
            question_lbl.innerHTML = "Correct! " + answer_string;
            add_new_animal_to_mix(question_data[3]);
            setTimeout(function() {
                question_panel.style.display = "none";
                check_winner();
            }, 3000);
            document.getElementById("player_score").innerHTML = player_score.toString();
            document.getElementById("nadia_score").innerHTML = nadia_score.toString();
        }

        false_btn.onclick = function() {
            nadia_score += 1;
            button_div.style.display = "none";
            question_lbl.innerHTML = "Wrong. " + answer_string;
            add_new_animal_to_mix(question_data[3]);
            setTimeout(function() {
                question_panel.style.display = "none";
                check_winner();
            }, 3000);
            document.getElementById("player_score").innerHTML = player_score.toString();
            document.getElementById("nadia_score").innerHTML = nadia_score.toString();
        }
    }
    else {
        true_btn.onclick = function() {
            nadia_score += 1;
            button_div.style.display = "none";
            question_lbl.innerHTML = "Wrong. " + answer_string;
            add_new_animal_to_mix(question_data[3]);
            setTimeout(function() {
                question_panel.style.display = "none";
                check_winner();
            }, 3000);
            document.getElementById("player_score").innerHTML = player_score.toString();
            document.getElementById("nadia_score").innerHTML = nadia_score.toString();
        }

        false_btn.onclick = function() {
            player_score += 1;
            button_div.style.display = "none";
            question_lbl.innerHTML = "Correct! " + answer_string;
            add_new_animal_to_mix(question_data[3]);
            setTimeout(function() {
                
                question_panel.style.display = "none";
                check_winner();
            }, 3000);
            document.getElementById("player_score").innerHTML = player_score.toString();
            document.getElementById("nadia_score").innerHTML = nadia_score.toString();
        }
    }
}

function add_new_animal_to_mix(animal) {
    training_data.push(animal);
    initialize_subsets();
    calculate_all_probabilities();

    update_training_data_table();
    update_prob_tbl_selection();
}

document.display_probability_table = display_probability_table;
document.setup_question = setup_question;

