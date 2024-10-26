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
    let startTime; // For timing the quiz
    let isRevisitingUnanswered = false;
    let unansweredIndex = 0; // Index for the unanswered array

    // Load quiz data based on chapter selection
    function loadQuizData(jsonPath) {
        fetch(jsonPath)
            .then(response => response.json())
            .then(data => {
                quizData = data.quiz;
                currentQuestionIndex = 0; // Reset the index for new chapter
                chapterLinks.style.display = "none";
                const header = document.querySelector('h1');
                if (header) header.style.display = "none"; // Hide header when a chapter is selected
                quizContainer.style.display = "block"; // Show quiz container
                questionContainer.style.display = "block"; // Show question container
                startTime = new Date(); // Start the timer
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
        submitButton.textContent = "Sprawdź odpowiedź"; // Reset button text
    }

    // Handle answer submission
    submitButton.addEventListener("click", () => {
        // If the button text is "Powrót do początku", refresh the page
        if (submitButton.textContent === "Powrót do początku") {
            location.reload();
            return;
        }

        let question;
        if (isRevisitingUnanswered) {
            question = quizData[unanswered[unansweredIndex]];
        } else {
            question = quizData[currentQuestionIndex];
        }

        let userAnswers = [];

        if (question.type === "radio_button" || question.type === "tickboxes") {
            const selectedOptions = document.querySelectorAll("input[name='option']:checked");
            selectedOptions.forEach(option => userAnswers.push(option.value));
        } else if (question.type === "input") {
            const inputAnswers = document.querySelectorAll(".input-answer");
            inputAnswers.forEach((input, i) => {
                let value = input.value;
                if (value.trim() !== "") {
                    userAnswers.push(`${i + 1}. ${value}`);
                }
            }); // Capture numbered answers
        }

        if (userAnswers.length === 0) {
            alert("Nie odpowiedziałeś!");
            if (!isRevisitingUnanswered) {
                unanswered.push(currentQuestionIndex);
            }
        } else {
            console.log("User Answers:", JSON.stringify(userAnswers));
            console.log("Correct Answers:", JSON.stringify(question.correct_answers));

            // Process correct answers for comparison
            let processedCorrectAnswers = question.correct_answers.map(answer => {
                let value = answer.replace(/\s+/g, ""); // Remove all whitespaces
                value = value.replace(/[,\.]/g, ""); // Remove commas and periods
                value = value.toUpperCase(); // Convert to uppercase
                return value;
            });

            // Process user answers for comparison
            let processedUserAnswers = userAnswers.map(answer => {
                let value = answer.replace(/\s+/g, ""); // Remove all whitespaces
                value = value.replace(/[,\.]/g, ""); // Remove commas and periods
                value = value.toUpperCase(); // Convert to uppercase
                return value;
            });

            if (JSON.stringify(processedUserAnswers.sort()) === JSON.stringify(processedCorrectAnswers.sort())) {
                // Correct answer
                alert("Poprawna odpowiedź!");
            } else {
                alert(`Niepoprawna odpowiedź. Poprawna odpowiedź to: ${question.correct_answers.join(", ")}`);

                // Include correct answer and explanation in wrongAnswers
                wrongAnswers.push({
                    question: question.question,
                    userAnswer: userAnswers,
                    correctAnswer: question.correct_answers,
                    explanation: question.explanation
                });
            }

            // Remove the question from unanswered if it was previously unanswered
            if (isRevisitingUnanswered) {
                unanswered.splice(unansweredIndex, 1);
                // Decrement unansweredIndex to stay at the current index after removal
                unansweredIndex--;
            }

            // Commented out to avoid immediate explanation alerts
            // Show explanation immediately if desired
            // if (question.explanation && question.explanation.trim() !== "") {
            //     alert(`Wyjaśnienie: ${question.explanation}`);
            // }
        }

        // Move to the next question
        if (isRevisitingUnanswered) {
            unansweredIndex++;
            if (unansweredIndex < unanswered.length) {
                displayQuestion(unanswered[unansweredIndex]);
            } else {
                showResults();
            }
        } else {
            currentQuestionIndex++;
            if (currentQuestionIndex < quizData.length) {
                displayQuestion(currentQuestionIndex);
            } else if (unanswered.length > 0) {
                // Start revisiting unanswered questions
                isRevisitingUnanswered = true;
                unansweredIndex = 0;
                displayQuestion(unanswered[unansweredIndex]);
            } else {
                showResults();
            }
        }
    });

    // Show final results
    function showResults() {
        questionContainer.innerHTML = "<h2>Wyniki</h2>";
        // Calculate total time taken
        const endTime = new Date();
        const timeDiff = endTime - startTime; // Time difference in milliseconds
        const timeInSeconds = Math.round(timeDiff / 1000);
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;
        const timeTaken = `${minutes} min ${seconds} sek`;

        const timeTakenElement = document.createElement("p");
        timeTakenElement.textContent = `Czas rozwiązania testu: ${timeTaken}`;
        questionContainer.appendChild(timeTakenElement);

        if (wrongAnswers.length > 0) {
            const wrongAnswersList = document.createElement("ul");
            wrongAnswers.forEach(item => {
                const listItem = document.createElement("li");
                listItem.style.listStyleType = "none"; // Remove bullet points

                // Display question, user's answer, correct answer, and explanation
                listItem.innerHTML = `<p><strong>Pytanie:</strong> ${item.question}</p>
                                      <p><strong>Twoja odpowiedź:</strong> ${item.userAnswer.join(", ")}</p>
                                      <p><strong>Poprawna odpowiedź:</strong> ${item.correctAnswer.join(", ")}</p>`;
                if (item.explanation && item.explanation.trim() !== "") {
                    listItem.innerHTML += `<p><strong>Wyjaśnienie:</strong> ${item.explanation}</p>`;
                }

                // Add a gray thin line between questions
                listItem.innerHTML += `<hr style="border: 0; height: 1px; background: #ccc; margin: 20px 0;">`;

                wrongAnswersList.appendChild(listItem);
            });
            questionContainer.appendChild(wrongAnswersList);
        } else {
            questionContainer.innerHTML += "<p>Gratulacje! Wszystkie odpowiedzi są poprawne!</p>";
        }

        // Change the submit button to "Powrót do początku"
        submitButton.textContent = "Powrót do początku";
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
    questionText.style.display = "none";
    optionsContainer.style.display = "none";
    submitButton.style.display = "none";
});
