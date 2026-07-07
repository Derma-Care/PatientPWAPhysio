export default function BodySvg({ veiew, onClickPart, getColor }) {
  return (
    <g>
      {/* ================= FRONT ================= */}
      <g transform="translate(42, -20)">
        <ellipse
          cx="100"
          cy="65"
          rx="25"
          ry="35"
          fill={getColor('head')}
          onClick={(e) => onClickPart('head', e)}
        />
        <rect
          x="85"
          y="100"
          width="30"
          height="15"
          fill={getColor('neck')}
          onClick={(e) => onClickPart('neck', e)}
        />
        <path
          d="M70 115 L140 115 L140 200 L60 200 Z"
          fill={getColor('chest')}
          onClick={(e) => onClickPart('chest', e)}
        />
        <path
          d="M55 200 L145 200 L145 260 L60 260 Z"
          fill={getColor('abdomen')}
          onClick={(e) => onClickPart('abdomen', e)}
        />
        <path
          d="M60 260 L150 260 L150 310 L55 310 Z "
          fill={getColor('pelvis')}
          onClick={(e) => onClickPart('pelvis', e)}
        />
        <circle
          cx="52"
          cy="140"
          r="17"
          fill={getColor('rightShoulder')}
          onClick={(e) => onClickPart('rightShoulder', e)}
        />
        <circle
          cx="155"
          cy="140"
          r="20"
          fill={getColor('leftShoulder')}
          onClick={(e) => onClickPart('leftShoulder', e)}
        />
        <rect
          x="25"
          y="165"
          width="30"
          height="55"
          fill={getColor('rightArm')}
          transform="rotate(5 172.5 260)"
          onClick={(e) => onClickPart('rightArm', e)}
        />
        <rect
          x="150"
          y="150"
          width="30"
          height="60"
          fill={getColor('leftArm')}
          onClick={(e) => onClickPart('leftArm', e)}
        />
        <rect
          x="20"
          y="255"
          width="25"
          height="45"
          fill={getColor('rightForearm')}
          transform="rotate(10 172.5 260)"
          onClick={(e) => onClickPart('rightForearm', e)}
        />
        <rect
          x="20"
          y="220"
          width="35"
          height="22"
          fill={getColor('rightInnerElbow')}
          transform="rotate(5 172.5 260)"
          onClick={(e) => onClickPart('rightInnerElbow', e)}
        />
        <rect
          x="18"
          y="300"
          width="25"
          height="20"
          fill={getColor('rightWrist')}
          transform="rotate(10 172.5 260)"
          onClick={(e) => onClickPart('rightWrist', e)}
        />
        <rect
          x="3"
          y="320"
          width="45"
          height="50"
          fill={getColor('rightPlam')}
          transform="rotate(10 172.5 260)"
          onClick={(e) => onClickPart('rightPlam', e)}
        />
        <rect
          x="170"
          y="230"
          width="30"
          height="50"
          fill={getColor("leftForearm")}
          transform="rotate(-15 172.5 260)"
          onClick={(e) => onClickPart("leftForearm", e)}
        />
        <rect
          x="150"
          y="210"
          width="35"
          height="20"
          fill={getColor('leftInnerElbow')}
          transform="rotate(5 172.5 260)"
          onClick={(e) => onClickPart('leftInnerElbow', e)}
        />
        <rect
          x="170"
          y="280"
          width="30"
          height="20"
          fill={getColor("leftWrist")}
          transform="rotate(-15 172.5 260)"
          onClick={(e) => onClickPart("leftWrist", e)}
        />
        <rect
          x="165"
          y="300"
          width="45"
          height="50"
          fill={getColor("leftPlam")}
          transform="rotate(-15 172.5 260)"
          onClick={(e) => onClickPart("leftPlam", e)}
        />
        <path
          d="M55 310 L100 310 L100 380 60 380 Z "
          fill={getColor('rightThigh')}
          onClick={(e) => onClickPart('rightThigh', e)}
        />
        <path
          d="M100 310 L150 310 L145 380 110 380 Z "
          fill={getColor('leftThigh')}
          onClick={(e) => onClickPart('leftThigh', e)}
        />
        <circle
          cx="83"
          cy="400"
          r="20"
          fill={getColor('rightKnee')}
          onClick={(e) => onClickPart('rightKnee', e)}
        />
        <circle
          cx="125"
          cy="400"
          r="20"
          fill={getColor('leftKnee')}
          onClick={(e) => onClickPart('leftKnee', e)}
        />
        <path
          d="M70 420 L110 420 L105 510 85 510 Z "
          fill={getColor('rightLeg')}
          onClick={(e) => onClickPart('rightLeg', e)}
        />
        <path
          d="M110 420 L150 420 L135 510 110 510 Z "
          fill={getColor('leftLeg')}
          onClick={(e) => onClickPart('leftLeg', e)}
        />
        <ellipse
          cx="95"
          cy="540"
          rx="15"
          ry="30"
          fill={getColor('rightFoot')}
          onClick={(e) => onClickPart('rightFoot', e)}
        />
        <ellipse
          cx="128"
          cy="535"
          rx="15"
          ry="35"
          fill={getColor('leftFoot')}
          onClick={(e) => onClickPart('leftFoot', e)}
        />
      </g>

      {/* ================= BACK ================= */}
      <g transform="translate(350 -20)" >
        <ellipse
          cx="105"
          cy="55"
          rx="25"
          ry="27"
          fill={getColor('backHead')}
          onClick={(e) => onClickPart('backHead', e)}
        />
        <rect
          x="88"
          y="83"
          width="30"
          height="25"
          fill={getColor('backNeck')}
          onClick={(e) => onClickPart('backNeck', e)}
        />
        <path
          d="M60 110 L145 110 L145 170 L60 170 Z"
          fill={getColor('upperBack')}
          onClick={(e) => onClickPart('upperBack', e)}
        />
        <path
          d="M55 170 L155 170 L140 240 L60 240 Z"
          fill={getColor('lowerBack')}
          onClick={(e) => onClickPart('lowerBack', e)}
        />
        <path
          d="M60 240 L140 240 L160 300 L40 300 Z"
          fill={getColor('hip')}
          onClick={(e) => onClickPart('hip', e)}
        />
        <path
          transform="rotate(30 40 160)"
          d="M20 140 L50 140 L90 220 L60 230 Z"
          fill={getColor('backLeftArm')}
          onClick={(e) => onClickPart('backLeftArm', e)}
        />
        <rect
          x="10"
          y="230"
          width="35"
          height="30"
          fill={getColor('LeftOuterElbow')}
          onClick={(e) => onClickPart('LeftOuterElbow', e)}
        />
        <rect
          x="50"
          y="250"
          width="35"
          height="40"
          transform="rotate(10 0 0)"
          fill={getColor('LeftForearm')}
          onClick={(e) => onClickPart('LeftForearm', e)}
        />
        <rect
          x="50"
          y="290"
          width="35"
          height="20"
          transform="rotate(10 0 0)"
          fill={getColor('LeftDorsal')}
          onClick={(e) => onClickPart('LeftDorsal', e)}
        />
        <rect
          x="30"
          y="310"
          width="50"
          height="60"
          transform="rotate(10 0 0)"
          fill={getColor('LeftBackofHand')}
          onClick={(e) => onClickPart('LeftBackofHand', e)}
        />
        <path
          transform="rotate(-0 140 190)"
          d="M145 140 L180 140 L180 230 L160 230 Z"
          fill={getColor('backRightArm')}
          onClick={(e) => onClickPart('backRightArm', e)}
        />
        <rect
          x="155"
          y="230"
          width="35"
          height="30"
          fill={getColor('rightOuterElbow')}
          onClick={(e) => onClickPart('rightOuterElbow', e)}
        />
        <rect
          x="150"
          y="265"
          width="35"
          height="40"
          transform="rotate(-10 140 190)"
          fill={getColor('rightForearm')}
          onClick={(e) => onClickPart('rightForearm', e)}
        />
        <rect
          x="150"
          y="305"
          width="35"
          height="20"
          transform="rotate(-10 140 190)"
          fill={getColor('rightDorsal')}
          onClick={(e) => onClickPart('rightDorsal', e)}
        />
        <rect
          x="155"
          y="325"
          width="45"
          height="60"
          transform="rotate(-10 140 190)"
          fill={getColor('rightBackofHand')}
          onClick={(e) => onClickPart('rightBackofHand', e)}
        />
        <rect
          x="50"
          y="300"
          width="50"
          height="110"
          transform="rotate(0, 240 200)"
          fill={getColor('backLeftThigh')}
          onClick={(e) => onClickPart('backLeftThigh', e)}
        />
        <rect
          x="100"
          y="300"
          width="50"
          height="110"
          fill={getColor('backRightThigh')}
          onClick={(e) => onClickPart('backRightThigh', e)}
        />
        <circle
          cx="75"
          cy="430"
          r="20"
          fill={getColor('backLeftKnee')}
          onClick={(e) => onClickPart('backLeftKnee', e)}
        />
        <circle
          cx="120"
          cy="430"
          r="20"
          fill={getColor('backRightKnee')}
          onClick={(e) => onClickPart('backRightKnee', e)}
        />
        <rect
          x="55"
          y="450"
          width="40"
          height="80"
          fill={getColor('leftCalf')}
          onClick={(e) => onClickPart('leftCalf', e)}
        />
        <rect
          x="100"
          y="450"
          width="40"
          height="80"
          fill={getColor('rightCalf')}
          onClick={(e) => onClickPart('rightCalf', e)}
        />
        <ellipse
          cx="85"
          cy="575"
          rx="15"
          ry="45"
          fill={getColor('backLeftFoot')}
          onClick={(e) => onClickPart('backLeftFoot', e)}
        />
        <ellipse
          cx="115"
          cy="575"
          rx="15"
          ry="45"
          fill={getColor('backRightFoot')}
          onClick={(e) => onClickPart('backRightFoot', e)}
        />
      </g>
    </g>
  );
}
