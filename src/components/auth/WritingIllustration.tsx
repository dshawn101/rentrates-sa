/** Original vector artwork: five open books, an ink bottle and a writing quill. */
export function WritingIllustration() {
  return (
    <svg className="signin-illustration" viewBox="0 0 640 620" role="img" aria-labelledby="writing-art-title writing-art-desc">
      <title id="writing-art-title">Five open books, ink and a writing quill</title>
      <desc id="writing-art-desc">Purple and white line art of five open books stacked together. A feather quill rests above an ink bottle. The top page reads: Your next chapter begins with a single word.</desc>
      <defs>
        <linearGradient id="book-paper" x2="0.9" y2="1"><stop stopColor="#302248" /><stop offset="1" stopColor="#171327" /></linearGradient>
        <linearGradient id="quill-feather" x2="1" y2="1"><stop stopColor="#ddd6fe" stopOpacity=".35" /><stop offset="1" stopColor="#a78bfa" stopOpacity=".04" /></linearGradient>
      </defs>
      <g fill="none" stroke="#c4b5fd" strokeWidth="1.5" opacity=".45">
        <ellipse cx="322" cy="536" rx="252" ry="35" />
        <path d="M78 178v16m-8-8h16M543 252v20m-10-10h20M492 104v14m-7-7h14M118 402v12m-6-6h12" />
        <circle cx="150" cy="122" r="3" /><circle cx="557" cy="380" r="3" /><circle cx="92" cy="302" r="2" />
      </g>
      {[0, 1, 2, 3, 4].map((book) => (
        <g key={book} transform={`translate(${book % 2 ? -9 : 0} ${72 - book * 39})`} strokeLinecap="round" strokeLinejoin="round">
          <path d="M100 350Q209 310 320 363Q428 313 540 350L540 417Q428 385 320 438Q210 387 100 417Z" fill="#171327" stroke="#a78bfa" strokeWidth="2" />
          <path d="M105 347Q214 301 320 355Q426 301 535 347L535 402Q427 368 320 420Q212 368 105 402Z" fill="url(#book-paper)" stroke="#ddd6fe" strokeWidth="1.6" />
          <path d="M320 355V420M111 390Q218 359 313 405M327 405Q430 358 529 390M111 396Q216 365 313 411M327 411Q431 364 529 396" fill="none" stroke="#c4b5fd" strokeWidth="1" opacity=".6" />
          {book === 4 && <g>
            <path d="M126 348Q214 321 294 355M126 359Q210 334 294 367M126 371Q208 347 294 379" fill="none" stroke="#c4b5fd" opacity=".3" />
            <text fill="#f5f3ff" stroke="none" fontFamily="Georgia, serif" fontStyle="italic" fontSize="17" transform="translate(345 348) rotate(-7)">
              <tspan x="0" y="0">Your next chapter</tspan><tspan x="0" dy="23">begins with</tspan><tspan x="0" dy="23">a single word.</tspan>
            </text>
            <path d="M343 411q65-27 129-20" fill="none" stroke="#a78bfa" />
          </g>}
        </g>
      ))}
      <g stroke="#ddd6fe" strokeWidth="1.8" strokeLinejoin="round">
        <path d="M195 244v-24h36v24l14 12v39q-32 15-64 0v-39Z" fill="#211831" />
        <ellipse cx="213" cy="220" rx="18" ry="5" fill="#110e1c" />
        <path d="M188 267q25 10 50 0M192 281v8" fill="none" stroke="#a78bfa" />
        <path d="M216 216C207 156 257 80 365 38C360 122 313 189 232 202L216 229" fill="url(#quill-feather)" />
        <path d="M216 229Q266 130 351 55M243 177l-8-41M259 153l-3-45M277 131l4-42M291 115l40-5M267 147l47-10M243 181l43-13" fill="none" stroke="#c4b5fd" />
      </g>
      <path d="M247 299q19-8 29 0t17 0" fill="none" stroke="#c4b5fd" strokeWidth="2" />
    </svg>
  );
}
