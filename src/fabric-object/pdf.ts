import * as fabric from "fabric";

interface UniquePdfProps {
  src?: string;
}

const PDF_PROPS: Array<keyof UniquePdfProps> = ["src"];

export const pdfDefaultValues: Partial<fabric.TClassProperties<Pdf>> = {};

export interface PdfProps extends fabric.TextboxProps, UniquePdfProps {}
export interface SerializedPdfProps extends fabric.SerializedTextboxProps, UniquePdfProps {}

export class Pdf<
    Props extends fabric.TOptions<PdfProps> = Partial<PdfProps>,
    SProps extends SerializedPdfProps = SerializedPdfProps,
    EventSpec extends fabric.ObjectEvents = fabric.ObjectEvents,
  >
  extends fabric.FabricObject<Props, SProps, EventSpec>
  implements UniquePdfProps
{
  declare src?: string;

  constructor(options?: Props) {
    super(options);
    Object.assign(this, pdfDefaultValues);
    this.setOptions(options);
  }

  override toObject<T extends Omit<Props & fabric.TClassProperties<this>, keyof SProps>, K extends keyof T = never>(
    propertiesToInclude: K[] = [],
  ): Pick<T, K> & SProps {
    return super.toObject([...propertiesToInclude, ...PDF_PROPS] as (keyof T)[]);
  }
}
