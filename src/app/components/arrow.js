const Arrow = ({ start, end }) => {
    return (
        <svg
            width="100%"
            height="100%"
            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        >
            <line
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke="black"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
            />
            <defs>
                <marker
                    id="arrowhead"
                    viewBox="0 0 10 10"
                    refX="5"
                    refY="5"
                    orient="auto"
                    markerWidth="6"
                    markerHeight="6"
                >
                    <path d="M0,0 L10,5 L0,10 z" fill="black" />
                </marker>
            </defs>
        </svg>
    );
};
