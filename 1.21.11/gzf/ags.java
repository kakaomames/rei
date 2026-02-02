import com.google.common.collect.Lists;
import com.mojang.datafixers.util.Pair;
import java.util.List;

public class ags implements aay<adb> {
   public static final aao<xq, ags> a = aay.a(ags::a, ags::new);
   private static final byte b = -128;
   private final int c;
   private final List<Pair<cgv, dlt>> d;

   public ags(int $$0, List<Pair<cgv, dlt>> $$1) {
      this.c = $$0;
      this.d = $$1;
   }

   private ags(xq $$0) {
      this.c = $$0.l();
      this.d = Lists.newArrayList();

      byte $$1;
      do {
         $$1 = $$0.readByte();
         cgv $$2 = (cgv)cgv.j.get($$1 & 127);
         dlt $$3 = (dlt)dlt.h.decode($$0);
         this.d.add(Pair.of($$2, $$3));
      } while(($$1 & -128) != 0);

   }

   private void a(xq $$0) {
      $$0.c(this.c);
      int $$1 = this.d.size();

      for(int $$2 = 0; $$2 < $$1; ++$$2) {
         Pair<cgv, dlt> $$3 = (Pair)this.d.get($$2);
         cgv $$4 = (cgv)$$3.getFirst();
         boolean $$5 = $$2 != $$1 - 1;
         int $$6 = $$4.ordinal();
         $$0.l($$5 ? $$6 | -128 : $$6);
         dlt.h.encode($$0, (dlt)$$3.getSecond());
      }

   }

   public aba<ags> a() {
      return ahz.aN;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   public int b() {
      return this.c;
   }

   public List<Pair<cgv, dlt>> e() {
      return this.d;
   }
}
