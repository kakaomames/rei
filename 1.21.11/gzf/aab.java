import com.mojang.serialization.Codec;
import com.mojang.serialization.MapCodec;
import com.mojang.serialization.codecs.RecordCodecBuilder;

public record aab(doy b, boolean c) implements zz {
   public static final MapCodec<aab> a = RecordCodecBuilder.mapCodec(($$0) -> {
      return $$0.group(doy.a.fieldOf("player").forGetter(aab::d), Codec.BOOL.optionalFieldOf("hat", true).forGetter(aab::e)).apply($$0, aab::new);
   });

   public aab(doy param1, boolean param2) {
      this.b = $$0;
      this.c = $$1;
   }

   public ym b() {
      return new ym.b(this.b, this.c);
   }

   public String c() {
      return (String)this.b.d().map(($$0) -> {
         return "[" + $$0 + " head]";
      }).orElse("[unknown player head]");
   }

   public MapCodec<aab> a() {
      return a;
   }

   public doy d() {
      return this.b;
   }

   public boolean e() {
      return this.c;
   }
}
