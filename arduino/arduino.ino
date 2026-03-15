/*
 * Pi Brain — Joystick Controller
 * Arduino Uno
 *
 * Wiring:
 *   A0  Left joystick X  (left/right)
 *   A1  Left joystick Y  (up/down)
 *   A2  Right joystick X (twist left/right)
 *   A3  Right joystick Y (up/down)
 *   D2  Button 1  (INPUT_PULLUP — press = LOW)
 *   D3  Button 2
 *   D4  Button 3
 *   D5  E-Stop    (INPUT_PULLUP — press = LOW → sends ESTOP=1)
 *
 * Serial output (9600 baud, one line per transmission):
 *   "LX LY RX RY BTN ESTOP\n"
 *
 *   LX, LY, RX, RY  — raw analog 0-1023 (centre ~512)
 *   BTN              — bitmask: bit0=B1, bit1=B2, bit2=B3
 *   ESTOP            — 1 when e-stop is pressed, else 0
 *
 * Behaviour:
 *   - Transmits when any value has changed (axes by more than CHANGE_THRESHOLD)
 *   - Always transmits at least every KEEPALIVE_MS milliseconds
 *   - Dead-zone applied on the Arduino side to reduce noise (DEADZONE)
 */

// -- Pin assignments ----------------------------------------------------------
const int PIN_LX    = A0;
const int PIN_LY    = A1;
const int PIN_RX    = A2;
const int PIN_RY    = A3;
const int PIN_BTN1  = 2;
const int PIN_BTN2  = 3;
const int PIN_BTN3  = 4;
const int PIN_ESTOP = 5;

// -- Tuning -------------------------------------------------------------------
const int  CENTER           = 512;  // ADC mid-point
const int  DEADZONE         = 30;   // ignore drift within +/-this of center
const int  CHANGE_THRESHOLD = 8;    // minimum axis change to trigger send
const long KEEPALIVE_MS     = 500;  // send at least this often (ms)
const long SAMPLE_MS        = 50;   // loop rate (ms)

// -- State --------------------------------------------------------------------
int  prev_lx   = CENTER;
int  prev_ly   = CENTER;
int  prev_rx   = CENTER;
int  prev_ry   = CENTER;
byte prev_btn  = 0;
byte prev_estop = 0;
long last_send  = 0;

// Apply dead-zone: values within +/-DEADZONE of center become CENTER
int applyDeadzone(int val) {
  if (abs(val - CENTER) <= DEADZONE) return CENTER;
  return val;
}

void setup() {
  Serial.begin(9600);
  pinMode(PIN_BTN1,  INPUT_PULLUP);
  pinMode(PIN_BTN2,  INPUT_PULLUP);
  pinMode(PIN_BTN3,  INPUT_PULLUP);
  pinMode(PIN_ESTOP, INPUT_PULLUP);
}

void loop() {
  // Read axes with dead-zone
  int lx = applyDeadzone(analogRead(PIN_LX));
  int ly = applyDeadzone(analogRead(PIN_LY));
  int rx = applyDeadzone(analogRead(PIN_RX));
  int ry = applyDeadzone(analogRead(PIN_RY));

  // Read buttons (LOW = pressed because INPUT_PULLUP)
  byte b1    = (digitalRead(PIN_BTN1)  == LOW) ? 1 : 0;
  byte b2    = (digitalRead(PIN_BTN2)  == LOW) ? 1 : 0;
  byte b3    = (digitalRead(PIN_BTN3)  == LOW) ? 1 : 0;
  byte btn   = b1 | (b2 << 1) | (b3 << 2);
  byte estop = (digitalRead(PIN_ESTOP) == LOW) ? 1 : 0;

  long now = millis();

  bool axisChanged  = (abs(lx - prev_lx) > CHANGE_THRESHOLD) ||
                      (abs(ly - prev_ly) > CHANGE_THRESHOLD) ||
                      (abs(rx - prev_rx) > CHANGE_THRESHOLD) ||
                      (abs(ry - prev_ry) > CHANGE_THRESHOLD);
  bool btnChanged   = (btn   != prev_btn);
  bool estopChanged = (estop != prev_estop);
  bool keepalive    = ((now - last_send) >= KEEPALIVE_MS);

  if (axisChanged || btnChanged || estopChanged || keepalive) {
    Serial.print(lx);   Serial.print(' ');
    Serial.print(ly);   Serial.print(' ');
    Serial.print(rx);   Serial.print(' ');
    Serial.print(ry);   Serial.print(' ');
    Serial.print(btn);  Serial.print(' ');
    Serial.println(estop);

    prev_lx    = lx;
    prev_ly    = ly;
    prev_rx    = rx;
    prev_ry    = ry;
    prev_btn   = btn;
    prev_estop = estop;
    last_send  = now;
  }

  delay(SAMPLE_MS);
}
