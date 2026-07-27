import { IsString, IsNotEmpty } from 'class-validator'

export class ImportCsvDto {
  @IsString()
  @IsNotEmpty()
  csv: string
}
