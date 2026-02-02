import it.unimi.dsi.fastutil.ints.Int2ObjectMap;
import it.unimi.dsi.fastutil.ints.Int2ObjectMaps;
import it.unimi.dsi.fastutil.ints.Int2ObjectOpenHashMap;

public record ais(int b, int c, short d, byte e, dhu f, Int2ObjectMap<xa> g, xa h) implements aay<aib> {
   private static final int i = 128;
   private static final aao<xq, Int2ObjectMap<xa>> j;
   public static final aao<xq, ais> a;

   public ais(int param1, int param2, short param3, byte param4, dhu param5, Int2ObjectMap<xa> param6, xa param7) {
      $$5 = Int2ObjectMaps.unmodifiable($$5);
      this.b = $$0;
      this.c = $$1;
      this.d = $$2;
      this.e = $$3;
      this.f = $$4;
      this.g = $$5;
      this.h = $$6;
   }

   public aba<ais> a() {
      return ahz.bG;
   }

   public void a(aib $$0) {
      $$0.a(this);
   }

   public int b() {
      return this.b;
   }

   public int e() {
      return this.c;
   }

   public short f() {
      return this.d;
   }

   public byte g() {
      return this.e;
   }

   public dhu h() {
      return this.f;
   }

   public Int2ObjectMap<xa> i() {
      return this.g;
   }

   public xa j() {
      return this.h;
   }

   static {
      j = aam.a(Int2ObjectOpenHashMap::new, aam.e.a(Short::intValue, Integer::shortValue), xa.b, 128);
      a = aao.a(aam.x, ais::b, aam.h, ais::e, aam.e, ais::f, aam.c, ais::g, dhu.h, ais::h, j, ais::i, xa.b, ais::j, ais::new);
   }
}
