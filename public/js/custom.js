function textAreaAdjust(text) {
    var notes = document.getElementById('note_container');
    text.style.height = 'auto';
    notes.style.marginBottom = text.scrollHeight + 20 + "px";
    text.style.height = text.scrollHeight+'px';
    window.scrollTo(0,document.body.scrollHeight);
}

$("#note_input").keydown(function(e){
    if (e.keyCode === 13 && !e.shiftKey) {
        e.preventDefault();
        $('#add_note').submit();
    }
});

const drugs = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.whitespace,
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    local: drug_list
});
drugs.initialize();
initDrugAutocomplete();

function showDoses() {
    if (document.getElementById('currently_tripping_check').checked) {
        if (dose_wrapper.children.length <= 1) {
            addDose();
        }
        dose_wrapper.style.display = 'inline';
    }
    else {
        dose_wrapper.style.display = 'none';
    }
}

function addDose() {
    const div = document.createElement('div');
    div.className = 'form_div mb-2 row';
    div.innerHTML = `
        <div class="col-6">
            <input type="text" class='form-control drug_dropdown' name='drug' autocomplete=off placeholder="Drug"/>
        </div>
        <div class="col-6">
            <div class="input-group">
                <input type="text" class='form-control unit_dropdown' name='dose' autocomplete=off placeholder="Dose"/>
                <input type="text" class='form-control dose_dropdown' name='unit' autocomplete=off placeholder="Unit"/>
                <div class="input-group-append">
                    <div class="btn btn-outline-dark" onclick="rmDose(this)">
                        <i class="far fa-minus-square rm_dose my-auto"></i>
                    </div>
                </div>
            </div>
        </div>
    `;
    doseWrapper = document.getElementById('dose_wrapper');
    if (doseWrapper.children.length > 1) {
        document.getElementById('dose_title').innerHTML = "Doses";
    }
    doseWrapper.appendChild(div);
    initDrugAutocomplete();
}

function rmDose(input) {
    doseWrapper = document.getElementById('dose_wrapper');
    parent = input.parentNode.parentNode.parentNode.parentNode;
    if (doseWrapper.children.length <= 3) {
        document.getElementById('dose_title').innerHTML = "Dose";
    }
    if (doseWrapper.children.length <= 2) {
        doseWrapper.removeChild(parent);
        document.getElementById('currently_tripping_check').checked = false;
        showDoses();
        addDose();
    } else {
        document.getElementById('dose_wrapper').removeChild(parent);
    }
}

function initDrugAutocomplete() {
    $('.drug_dropdown').typeahead('destroy');
    $('.drug_dropdown').typeahead(
        {
            hint: true,
            highlight: true,
            minLength: 1
        },
        {
            name: 'drugs',
            source: drugs
        }
    );
}
