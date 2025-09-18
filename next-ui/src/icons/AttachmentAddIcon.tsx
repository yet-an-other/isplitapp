import { SvgPathWrapper } from './SvgPathWrapper';

// Paperclip with small plus badge (Flowbite style adaptation)
export function AttachmentAddIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <SvgPathWrapper iconProps={props}>
      <path d="M7 8v8a5 5 0 1 0 10 0V6.5a3.5 3.5 0 1 0-7 0V15a2 2 0 0 0 4 0V8" />
    </SvgPathWrapper>
  );
}

export default AttachmentAddIcon;
