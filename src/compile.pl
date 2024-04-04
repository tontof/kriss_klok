#!/usr/bin/perl
use warnings;
use strict;

my $filename = "kriss_klok.html";
my $html;

sub read_file {
  my $document = "";
  open my $input, '<', $_[0] or die "can't open $_[0]: $!";
  while (<$input>) {
    $document .= $_;
  }
  close $input or die "can't close $_[0]: $!";
  return $document;
}

sub base64img {
  my @base = split(/\//, $_[1]);
  pop(@base);
  my $format = "background-image: url\\(%s\\);";
  my $regex = sprintf $format,"(.*)";
  my $style = "";
  foreach (split(/\n/, $_[0])) {
    if ($_ =~ m/$regex/) {
      my $path = join("\/", @base)."/".$1;
      my $img = `base64 -w0 $path`;
      my $mime = `file -b --mime-type $path`;
      $mime = substr $mime, 0, -1;
      $img = sprintf $format,"data:$mime;base64,$img";
      $img =~ s/\\//g;
      $_ =~ s/$regex/$img/;
    }
    $style .= $_."\n";
  }
  return $style;
}

sub minify {
  my $output = "";
  foreach (split(/\n/, $_[0])) {
    $_ =~ s/^ *//;
    if ($_[1] eq 'css') {
      $_ =~ s/: /:/;
      $_ =~ s/ \{/\{/;
    }
    $output .= $_;
  }
  return $output;
}

sub base64icon {
  my $path = $_[0];
  my $img = `base64 -w0 $path`;
  my $mime = `file -b --mime-type $path`;
  $mime = substr $mime, 0, -1;
  $img = sprintf "data:$mime;base64,$img";
  return $img;
}


$html = "";
open(FH, '<', $filename) or die $!;
while(<FH>){
  if ($_ =~ m/([ ]*)<link rel="icon" type="image\/x-icon" href="([^"]*)">/) {
    $_ = "$1<link rel=\"icon\" href=\"".base64icon($2)."\">\n";
  }

  if ($_ =~ m/([ ]*)<link rel="stylesheet" href="([^"]*)">/) {
    $_ = "$1<style>".minify(base64img(read_file($2), $2), 'css')."</style>\n";
  }

  if ($_ =~ m/([ ]*)<script src="([^"]*)">/) {
    $_ = "$1<script>".minify(read_file($2), 'js')."</script>\n";
  }

  $html .= $_;
}
close(FH);

print $html;
