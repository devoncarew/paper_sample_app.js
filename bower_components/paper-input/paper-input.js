

  (function() {

    var paperInput = CoreStyle.g.paperInput = CoreStyle.g.paperInput || {};
    paperInput.focusedColor = '#4059a9';
    paperInput.invalidColor = '#d34336';

    Polymer('paper-input', {

      /**
       * The label for this input. It normally appears as grey text inside
       * the text input and disappears once the user enters text.
       *
       * @attribute label
       * @type string
       * @default ''
       */
      label: '',

      /**
       * If true, the label will "float" above the text input once the
       * user enters text instead of disappearing.
       *
       * @attribute floatingLabel
       * @type boolean
       * @default false
       */
      floatingLabel: false,

      /**
       * (multiline only) If set to a non-zero value, the height of this
       * text input will grow with the value changes until it is maxRows
       * rows tall. If the maximum size does not fit the value, the text
       * input will scroll internally.
       *
       * @attribute maxRows
       * @type number
       * @default 0
       */
      maxRows: 0,

      /**
       * The message to display if the input value fails validation. If this
       * is unset or the empty string, a default message is displayed depending
       * on the type of validation error.
       *
       * @attribute error
       * @type string
       */
      error: '',

      focused: false,
      pressed: false,

      attached: function() {
        if (this.multiline) {
          this.resizeInput();
          window.requestAnimationFrame(function() {
            this.$.underlineContainer.classList.add('animating');
          }.bind(this));
        }
      },

      resizeInput: function() {
        var height = this.$.inputClone.getBoundingClientRect().height;
        var bounded = this.maxRows > 0 || this.rows > 0;
        if (bounded) {
          var minHeight = this.$.minInputHeight.getBoundingClientRect().height;
          var maxHeight = this.$.maxInputHeight.getBoundingClientRect().height;
          height = Math.max(minHeight, Math.min(height, maxHeight));
        }
        this.$.inputContainer.style.height = height + 'px';
        this.$.underlineContainer.style.top = height + 'px';
      },

      prepareLabelTransform: function() {
        var toRect = this.$.floatedLabelSpan.getBoundingClientRect();
        var fromRect = this.$.labelSpan.getBoundingClientRect();
        if (toRect.width !== 0) {
          this.$.label.cachedTransform = 'scale(' + (toRect.width / fromRect.width) + ') ' +
            'translateY(' + (toRect.bottom - fromRect.bottom) + 'px)';
        }
      },

      toggleLabel: function(force) {
        var v = force !== undefined ? force : this.inputValue;

        if (!this.floatingLabel) {
          this.$.label.classList.toggle('hidden', v);
        }

        if (this.floatingLabel && !this.focused) {
          this.$.label.classList.toggle('hidden', v);
          this.$.floatedLabel.classList.toggle('hidden', !v);
        }
      },

      rowsChanged: function() {
        if (this.multiline && !isNaN(parseInt(this.rows))) {
          this.$.minInputHeight.innerHTML = '';
          for (var i = 0; i < this.rows; i++) {
            this.$.minInputHeight.appendChild(document.createElement('br'));
          }
          this.resizeInput();
        }
      },

      maxRowsChanged: function() {
        if (this.multiline && !isNaN(parseInt(this.maxRows))) {
          this.$.maxInputHeight.innerHTML = '';
          for (var i = 0; i < this.maxRows; i++) {
            this.$.maxInputHeight.appendChild(document.createElement('br'));
          }
          this.resizeInput();
        }
      },

      inputValueChanged: function() {
        this.super();

        if (this.multiline) {
          var escaped = this.inputValue.replace(/\n/gm, '<br>');
          if (!escaped || escaped.lastIndexOf('<br>') === escaped.length - 4) {
            escaped += '&nbsp';
          }
          this.$.inputCloneSpan.innerHTML = escaped;
          this.resizeInput();
        }

        this.toggleLabel();
      },

      labelChanged: function() {
        if (this.floatingLabel && this.$.floatedLabel && this.$.label) {
          // If the element is created programmatically, labelChanged is called before
          // binding. Run the measuring code in async so the DOM is ready.
          this.async(function() {
            this.prepareLabelTransform();
          });
        }
      },

      placeholderChanged: function() {
        this.label = this.placeholder;
      },

      inputFocusAction: function() {
        if (!this.pressed) {
          if (this.floatingLabel) {
            this.$.floatedLabel.classList.remove('hidden');
            this.$.floatedLabel.classList.add('focused');
            this.$.floatedLabel.classList.add('focusedColor');
          }
          this.$.label.classList.add('hidden');
          this.$.underlineHighlight.classList.add('focused');
          this.$.caret.classList.add('focused');

          this.super(arguments);
        }
        this.focused = true;
      },

      shouldFloatLabel: function() {
        // if type = number, the input value is the empty string until a valid number
        // is entered so we must do some hacks here
        return this.inputValue || (this.type === 'number' && !this.validity.valid);
      },

      inputBlurAction: function() {
        this.super(arguments);

        this.$.underlineHighlight.classList.remove('focused');
        this.$.caret.classList.remove('focused');

        if (this.floatingLabel) {
          this.$.floatedLabel.classList.remove('focused');
          this.$.floatedLabel.classList.remove('focusedColor');
          if (!this.shouldFloatLabel()) {
            this.$.floatedLabel.classList.add('hidden');
          }
        }

        // type = number hack. see core-input for more info
        if (!this.shouldFloatLabel()) {
          this.$.label.classList.remove('hidden');
          this.$.label.classList.add('animating');
          this.async(function() {
            this.$.label.style.webkitTransform = 'none';
            this.$.label.style.transform = 'none';
          });
        }

        this.focused = false;
      },

      downAction: function(e) {
        if (this.disabled) {
          return;
        }

        if (this.focused) {
          return;
        }

        this.pressed = true;
        var rect = this.$.underline.getBoundingClientRect();
        var right = e.x - rect.left;
        this.$.underlineHighlight.style.webkitTransformOriginX = right + 'px';
        this.$.underlineHighlight.style.transformOriginX = right + 'px';
        this.$.underlineHighlight.classList.remove('focused');
        this.underlineAsync = this.async(function() {
          this.$.underlineHighlight.classList.add('pressed');
        }, null, 200);

        // No caret animation if there is text in the input.
        if (!this.inputValue) {
          var width = this.$.inputCloneSpan.getBoundingClientRect().width;
          if (width < right) {
            this.$.caret.style.left = width + 'px';
            this.$.caret.classList.remove('focused');
          }
        }
      },

      upAction: function(e) {
        if (this.disabled) {
          return;
        }

        if (!this.pressed) {
          return;
        }

        // if a touchevent caused the up, the synthentic mouseevents will blur
        // the input, make sure to prevent those from being generated.
        if (e._source === 'touch') {
          e.preventDefault();
        }

        if (this.underlineAsync) {
          clearTimeout(this.underlineAsync);
          this.underlineAsync = null;
        }

        // Focus the input here to bring up the virtual keyboard.
        this.$.input.focus();
        this.pressed = false;
        this.animating = true;

        this.$.underlineHighlight.classList.remove('pressed');
        this.$.underlineHighlight.classList.add('animating');
        this.async(function() {
          this.$.underlineHighlight.classList.add('focused');
        });

        // No caret animation if there is text in the input.
        if (!this.inputValue) {
          this.$.caret.classList.add('animating');
          this.async(function() {
            this.$.caret.classList.add('focused');
          }, null, 100);
        }

        if (this.floatingLabel) {
          this.$.label.classList.add('focusedColor');
          this.$.label.classList.add('animating');
          if (!this.$.label.cachedTransform) {
            this.prepareLabelTransform();
          }
          this.$.label.style.webkitTransform = this.$.label.cachedTransform;
          this.$.label.style.transform = this.$.label.cachedTransform;
        }
      },

      keydownAction: function() {
        this.super();

        // more type = number hacks. see core-input for more info
        if (this.type === 'number') {
          this.async(function() {
            if (!this.inputValue) {
              this.toggleLabel(!this.validity.valid);
            }
          });
        }
      },

      keypressAction: function() {
        if (this.animating) {
          this.transitionEndAction();
        }
      },

      transitionEndAction: function(e) {
        this.animating = false;
        if (this.pressed) {
          return;
        }

        if (this.focused) {

          if (this.floatingLabel || this.inputValue) {
            this.$.label.classList.add('hidden');
          }

          if (this.floatingLabel) {
            this.$.label.classList.remove('focusedColor');
            this.$.label.classList.remove('animating');
            this.$.floatedLabel.classList.remove('hidden');
            this.$.floatedLabel.classList.add('focused');
            this.$.floatedLabel.classList.add('focusedColor');
          }

          this.async(function() {
            this.$.underlineHighlight.classList.remove('animating');
            this.$.caret.classList.remove('animating');
          }, null, 100);

        } else {

          this.$.label.classList.remove('animating');

        }
      }

    });

  }());

  