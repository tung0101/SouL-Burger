function Validator(formSelector, typeOfForm = '') {
    function getType() {
        switch (typeOfForm) {
            case 'signup':
                return 'Đăng ký';
            case 'signin':
                return 'Đăng nhập';
            default:
                return 'Thao tác';
        }
    }

    function getParent(element, selector) {
        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement;
            }
            element = element.parentElement;
        }
    }

    var formRules = {};
    var validatorRules = {
        required: function(value) {
            return value ? undefined : 'Vui lòng nhập trường này';
        },
        email: function(value) {
            var regEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regEmail.test(value) ? undefined : 'Vui lòng nhập email';
        },
        min: function(min) {
            return function(value) {
                return value.length >= min ? undefined : `Vui lòng nhập tối thiểu ${min} ký tự`;
            }
        },
        max: function(max) {
            return function(value) {
                return value.length <= max ? undefined : `Vui lòng nhập tối đa ${max} ký tự`;
            }
        },
        confirm: function(selector) {
            return function(value) {
                return value === document.body.querySelector(selector).value ? undefined : 'Mật khẩu nhập lại không hợp lệ';
            }
        }
    }
    var formElement = document.querySelector(formSelector);
    if (formElement) {
        var inputs = formElement.querySelectorAll('[name][rules]');
        for (let input of inputs) {

            var rules = input.getAttribute('rules').split('|');
            for (let rule of rules) {
                var ruleInfo;
                var isRuleHasValue = rule.includes(':');

                if (isRuleHasValue) {
                    ruleInfo = rule.split(':');
                    rule = ruleInfo[0];
                }

                var ruleFunc = validatorRules[rule];

                if (isRuleHasValue) {
                    ruleFunc = ruleFunc(ruleInfo[1]);
                }

                if (Array.isArray(formRules[input.name])) {
                    formRules[input.name].push(ruleFunc);
                } else {
                    formRules[input.name] = [ruleFunc];
                }
            }

            // Lắng nghe sự kiện để validate (blur, change)
            input.onblur = handleValidate;
            input.oninput = handleClearError;

        }

        function handleValidate(event) {
            var rules = formRules[event.target.name];
            var errorMessage;

            for (let rule of rules) {
                switch (event.target.type) {
                    case 'checkbox':
                    case 'radio':
                        errorMessage = rule(event.target.checked);
                        break;
                    default:
                        errorMessage = rule(event.target.value);
                        break;
                }
                if (errorMessage) break;
            }

            // Nếu có lỗi thì hiển thị lỗi ra UI
            if (errorMessage) {
                // console.log(event.target);
                var formGroup = getParent(event.target, '.form-group');

                if (formGroup) {
                    formGroup.classList.add('invalid');
                    var formMessage = formGroup.querySelector('.error-message');
                    if (formMessage) {
                        formMessage.innerHTML = errorMessage;
                    }
                }
                // console.log(formGroup);
            }
            // console.log(errorMessage);
            return !errorMessage;

        }

        // Hàm clear message lỗi
        function handleClearError(event) {
            var formGroup = getParent(event.target, '.form-group');
            if (formGroup.classList.contains('invalid')) {
                formGroup.classList.remove('invalid');
                var formMessage = formGroup.querySelector('.error-message');
                if (formMessage) {
                    setTimeout(() => {
                        formMessage.innerHTML = '';
                    }, 500);
                }
            }
        }
        // console.log(formRules);
    }


    // Xử lý hành vi submit form
    formElement.onsubmit = (event) => {
        event.preventDefault();

        var inputs = formElement.querySelectorAll('[name][rules]');
        var isValid = true;

        for (let input of inputs) {
            if (!handleValidate({ target: input })) {
                isValid = false;
            }
        }

        // Khi không có lỗi thì submit form
        if (isValid) {
            if (typeof this.onSubmit === 'function') {
                var enableInputs = formElement.querySelectorAll('[name]:not([disable])');
                var formValues = Array.from(enableInputs).reduce(function(values, input) {

                    switch (input.type) {
                        case 'radio':
                            values[input.name] = formElement.querySelector('input[name="' + input.name + '"]:checked').value;
                            break;
                        case 'checkbox':
                            if (!input.matches(':checked')) {
                                values[input.name] = '';
                                return values;
                            }

                            if (!Array.isArray(values[input.name])) {
                                values[input.name] = [];
                            };

                            values[input.name].push(input.value);

                            break;

                        case 'file':
                            values[input.name] = input.files;
                            break;
                        default:
                            values[input.name] = input.value;
                            break;
                    }

                    return values;
                }, {});
                this.onSubmit(getType());
                formElement.reset();
            } else {
                formElement.submit();
            }
        }
    }

}