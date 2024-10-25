document.addEventListener("DOMContentLoaded", () => {
    const quizContainer = document.getElementById("quiz-container");
    const questionContainer = document.getElementById("question-container");
    const questionText = document.getElementById("question-text");
    const optionsContainer = document.getElementById("options-container");
    const submitButton = document.getElementById("submit-answer");
    const nextButton = document.getElementById("next-question");
    const chapterLinks = document.getElementById("chapter-links");

    let currentQuestionIndex = 0;
    let quizData = [];
    let wrongAnswers = [];
    let unanswered = [];

    // Load quiz data based on chapter selection
    function loadQuizData(jsonPath) {
        fetch(jsonPath)
            .then(response => response.json())
            .then(data => {
                quizData = data.quiz;
                currentQuestionIndex = 0; // Reset the index for new chapter
                chapterLinks.style.display = "none";
                const header = document.querySelector('h1');
                if (header) header.style.display = "none"; // Hide 'Quiz Aplikacja - Wybierz Rozdział' header when a chapter is selected
                quizContainer.style.display = "block"; // Restore quiz container visibility change
                questionContainer.style.display = "block"; // Show question container when a chapter is selected
                displayQuestion(currentQuestionIndex);
            })
            .catch(error => console.error("Error loading quiz data:", error));
    }

    // Display a specific question
    function displayQuestion(index) {
        const question = quizData[index];
        if (!question) return;

        questionText.innerHTML = question.question;
        optionsContainer.innerHTML = "";
        const existingImage = document.querySelector('#question-image');
        if (existingImage) {
            existingImage.remove(); // Remove previous image if it exists
        }

        // Check if the question has an associated image
        if (question.image) {
            const imageElement = document.createElement("img");
            imageElement.src = question.image;
            imageElement.alt = `Image for question ${index + 1}`;
            imageElement.id = "question-image";
            imageElement.style.maxWidth = "100%";
            imageElement.style.marginBottom = "15px";
            questionContainer.insertBefore(imageElement, optionsContainer);
        }

        if (question.type === "radio_button" || question.type === "tickboxes") {
            question.options.forEach((option, i) => {
                const optionElement = document.createElement("div");
                const inputElement = document.createElement("input");
                const labelElement = document.createElement("label");

                inputElement.type = question.type === "radio_button" ? "radio" : "checkbox";
                inputElement.name = "option";
                inputElement.value = String.fromCharCode(65 + i); // Use letter representation for options (A, B, C...)
                labelElement.textContent = option;

                optionElement.appendChild(inputElement);
                optionElement.appendChild(labelElement);
                optionsContainer.appendChild(optionElement);
            });
        } else if (question.type === "input") {
            const optionsList = document.createElement("ul");
            question.options.forEach((option, i) => {
                const listItem = document.createElement("li");
                listItem.textContent = option;
                optionsList.appendChild(listItem);
            });
            optionsContainer.appendChild(optionsList);
            question.options.forEach((option, i) => {
                const inputElement = document.createElement("input");
                inputElement.type = "text";
                inputElement.placeholder = `${i + 1}.`; // Number the input fields
                inputElement.className = "input-answer";
                optionsContainer.appendChild(inputElement);
            });
        }

        questionText.style.display = "block";
        optionsContainer.style.display = "block";
        submitButton.style.display = "block";
    }

    // Handle answer submission
    submitButton.addEventListener("click", () => {
        const question = quizData[currentQuestionIndex];
        let userAnswers = [];

        if (question.type === "radio_button" || question.type === "tickboxes") {
            const selectedOptions = document.querySelectorAll("input[name='option']:checked");
            selectedOptions.forEach(option => userAnswers.push(option.value));
        } else if (question.type === "input") {
            const inputAnswers = document.querySelectorAll(".input-answer");
            inputAnswers.forEach((input, i) => {
            const trimmedValue = input.value.trim();
            if (trimmedValue !== "") {
                userAnswers.push(`${i + 1}. ${trimmedValue}`);
            }
        }); // Capture numbered answers
        }

        if (userAnswers.length === 0) {
            alert("Nie odpowiedziales!");
            unanswered.push(currentQuestionIndex);
        } else if (JSON.stringify(userAnswers.sort()) === JSON.stringify(question.correct_answers.sort())) {
            // Correct answer
        } else {
            alert(`Niepoprawna odpowiedź. Poprawna odpowiedź to: ${question.correct_answers.join(", ")}`);
            wrongAnswers.push({ question: question.question, userAnswer: userAnswers });
        }

        currentQuestionIndex++;
        if (currentQuestionIndex < quizData.length) {
            displayQuestion(currentQuestionIndex);
        } else if (unanswered.length > 0) {
            currentQuestionIndex = unanswered.shift();
            displayQuestion(currentQuestionIndex);
        } else {
            showResults();
        }
    });

    // Show final results
    function showResults() {
        questionContainer.innerHTML = "<h2>Wyniki</h2>";
        if (wrongAnswers.length > 0) {
            const wrongAnswersList = document.createElement("ul");
            wrongAnswers.forEach(item => {
                const listItem = document.createElement("li");
                listItem.textContent = `${item.question} - Twoja odpowiedź: ${item.userAnswer.join(", ")}`;
                wrongAnswersList.appendChild(listItem);
            });
            questionContainer.appendChild(wrongAnswersList);
        } else {
            questionContainer.innerHTML += "<p>Gratulacje! Wszystkie odpowiedzi są poprawne!</p>";
        }
    }

    // Load appropriate chapter data on link click
    document.querySelectorAll(".chapter-link").forEach(link => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            const jsonPath = link.getAttribute("data-json");
            loadQuizData(jsonPath);
        });
    });

    // Hide quiz elements initially
    questionText.style.display = "none"; // Change 1
    optionsContainer.style.display = "none"; // Change 2
    submitButton.style.display = "none"; // Change 3
});
